/**
 * @file Certificate service.
 * @description Turns completed learning modules into certificates. Tracks
 * are defined in `data/tracks.js`; a certificate is issued as soon as
 * every module in a track is complete.
 *
 * Issued certificates live in Supabase `certificates` with a
 * `localStorage` mirror, and each one carries a verification code so an
 * employer or funder can confirm it.
 */

import supabase from "./supabase.js";
import { CERTIFICATE_TRACKS, getTrackById } from "../data/tracks.js";

/** localStorage key prefix for the mirrored certificate cache. */
const STORAGE_PREFIX = "mmb_certificates_";

/**
 * Builds a readable, unique certificate reference such as
 * `MMB-2026-A1B2C3`.
 *
 * @returns {string}
 */
function makeReference() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MMB-${year}-${rand}`;
}

/**
 * Normalises a certificate record.
 *
 * @param {Object} [raw={}] - Partial certificate data.
 * @returns {Object|null}
 */
export function normaliseCertificate(raw = {}) {
  if (!raw || !raw.trackId) return null;
  return {
    id: raw.id || null,
    userId: raw.userId || null,
    trackId: raw.trackId,
    reference: raw.reference || null,
    issuedAt: raw.issuedAt || null,
    revoked: Boolean(raw.revoked),
    revokedAt: raw.revokedAt || null,
    name: raw.name || null,
  };
}

/**
 * Reads the locally cached certificates for a user.
 *
 * @param {string|null} userId - The user id.
 * @returns {Object[]}
 */
function readCache(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId || "anon"}`);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => normaliseCertificate(entry)).filter(Boolean);
  } catch (_) {
    return [];
  }
}

/**
 * Writes the local certificate cache.
 *
 * @param {Object[]} certificates - Certificate records.
 * @param {string|null} userId - The user id.
 * @returns {void}
 */
function writeCache(certificates, userId) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${userId || "anon"}`,
      JSON.stringify(certificates.filter(Boolean))
    );
  } catch (_) {
    /* best-effort only */
  }
}

/**
 * Converts a Supabase row into a certificate record.
 *
 * @param {Object} row - Raw database row.
 * @returns {Object}
 */
function fromRow(row) {
  return normaliseCertificate({
    id: row.id,
    userId: row.user_id,
    trackId: row.track_id,
    reference: row.reference,
    issuedAt: row.issued_at,
    revoked: row.revoked,
    revokedAt: row.revoked_at,
  });
}

/**
 * Fetches all certificates issued to a user.
 *
 * @param {string|null} userId - The user id.
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
export async function getCertificates(userId) {
  if (!userId) return { data: [], error: null };

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });
    if (error) throw error;
    if (!data || !data.length) return { data: readCache(userId), error: null };
    return { data: data.map(fromRow), error: null };
  } catch (err) {
    return { data: readCache(userId), error: err };
  }
}

/**
 * Reports the completion state of every certificate track.
 *
 * @param {Iterable<string|number>} completedModuleIds - Completed module ids.
 * @returns {Array<{ track: Object, total: number, done: number, pct: number, complete: boolean, missing: number[] }>}
 */
export function getTrackProgress(completedModuleIds) {
  const completed = new Set(
    Array.from(completedModuleIds || []).map((id) =>
      String(id)
        .trim()
        .replace(/^module\s*/i, "")
    )
  );

  return CERTIFICATE_TRACKS.map((track) => {
    const missing = track.moduleIds.filter((id) => !completed.has(String(id)));
    const done = track.moduleIds.length - missing.length;
    const total = track.moduleIds.length;
    return {
      track,
      total,
      done,
      missing,
      pct: total ? Math.round((done / total) * 100) : 0,
      complete: missing.length === 0 && total > 0,
    };
  });
}

/**
 * Issues certificates for every track the user has just completed.
 * Safe to call repeatedly — already-issued tracks are skipped.
 *
 * @param {string|null} userId - The user id.
 * @param {Iterable<string|number>} completedModuleIds - Completed module ids.
 * @param {Object} [options={}] - Options.
 * @param {string} [options.holderName] - Name printed on the certificate.
 * @returns {Promise<{ data: Object[], issued: Object[], error: Object|null }>}
 */
export async function issueEarnedCertificates(userId, completedModuleIds, options = {}) {
  if (!userId) return { data: [], issued: [], error: null };

  const { data: existing } = await getCertificates(userId);
  const have = new Set(existing.map((c) => c.trackId));
  const earned = getTrackProgress(completedModuleIds).filter(
    (entry) => entry.complete && !have.has(entry.track.id)
  );

  if (!earned.length) return { data: existing, issued: [], error: null };

  const issued = earned.map((entry) =>
    normaliseCertificate({
      userId,
      trackId: entry.track.id,
      reference: makeReference(),
      issuedAt: new Date().toISOString(),
      name: options.holderName || null,
    })
  );

  const merged = [...issued, ...existing];
  writeCache(merged, userId);

  try {
    const { error } = await supabase.from("certificates").insert(
      issued.map((cert) => ({
        user_id: cert.userId,
        track_id: cert.trackId,
        reference: cert.reference,
        name: cert.name,
        issued_at: cert.issuedAt,
        revoked: false,
      }))
    );
    return { data: merged, issued, error };
  } catch (err) {
    return { data: merged, issued, error: err };
  }
}

/**
 * Looks up a certificate by its public verification reference.
 *
 * @param {string} reference - The certificate reference, e.g. `MMB-2026-A1B2C3`.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function verifyCertificate(reference) {
  const code = String(reference || "").trim().toUpperCase();
  if (!code) return { data: null, error: new Error("Enter a certificate reference.") };

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("reference", code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { data: null, error: new Error("No certificate matches that reference.") };
    return { data: fromRow(data), error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Revokes a certificate (admin action).
 *
 * @param {string|number} id - The certificate row id.
 * @returns {Promise<{ error: Object|null }>}
 */
export async function revokeCertificate(id) {
  try {
    const { error } = await supabase
      .from("certificates")
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq("id", id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Builds a printable certificate document in a new window so it can be
 * saved as PDF or printed. Returns `null` when pop-ups are blocked.
 *
 * @param {Object} certificate - A certificate record.
 * @param {Object} track - The matching track definition.
 * @param {Object} [options={}] - Options.
 * @param {string} [options.holderName=""] - Name printed on the certificate.
 * @param {string} [options.modulesCompleted=""] - e.g. "5 of 5 modules".
 * @returns {Window|null}
 */
export function printCertificate(certificate, track, options = {}) {
  if (!track || typeof window === "undefined") return null;
  const holder = options.holderName || certificate.name || "Map My Biz Graduate";
  const date = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-ZA");

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return null;

  const escape = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  printWindow.document.write(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escape(track.name)} — Map My Biz</title>
    <style>
      body { font-family: Georgia, "Times New Roman", serif; margin: 0; padding: 40px;
             background: #f8fafc; color: #1a3b5d; }
      .cert { border: 6px double ${track.accent}; padding: 48px 40px; text-align: center;
              background: #fff; max-width: 760px; margin: 0 auto; }
      .brand { letter-spacing: 4px; text-transform: uppercase; font-size: 13px; color: #0A8791; }
      h1 { font-size: 30px; margin: 18px 0 6px; }
      .name { font-size: 34px; margin: 26px 0; border-bottom: 2px solid #B8D8D8;
              display: inline-block; padding: 0 40px 8px; }
      .desc { max-width: 560px; margin: 0 auto 22px; line-height: 1.6; color: #334155; }
      .meta { font-size: 13px; color: #475569; margin-top: 26px; }
      .ref { font-family: monospace; font-weight: 700; color: #0A8791; }
      button { margin-top: 24px; padding: 10px 22px; border: 0; border-radius: 8px;
               background: #0A8791; color: #fff; font-size: 15px; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="cert">
      <div class="brand">Map My Biz · Skills Development</div>
      <h1>${escape(track.name)}</h1>
      <div class="name">${escape(holder)}</div>
      <p class="desc">${escape(track.description)}</p>
      <p class="meta">
        Issued ${escape(date)} · ${escape(options.modulesCompleted || "")}<br />
        Verification reference: <span class="ref">${escape(certificate.reference || "—")}</span>
      </p>
    </div>
    <button onclick="window.print()">Print / Save as PDF</button>
  </body>
</html>`);
  printWindow.document.close();
  return printWindow;
}

export { CERTIFICATE_TRACKS, getTrackById };

export default {
  getCertificates,
  getTrackProgress,
  issueEarnedCertificates,
  verifyCertificate,
  revokeCertificate,
  printCertificate,
  normaliseCertificate,
};
