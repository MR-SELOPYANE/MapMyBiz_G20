/**
 * @file Mentor request store.
 * @description Stores mentorship requests locally in `localStorage` so an
 * entrepreneur can track requests they've submitted, even offline.
 */

import { SAVED_TYPES } from "./saved.service.js";

const MENTOR_REQUESTS_KEY = "mmb_mentor_requests";

/**
 * Reads the full mentor-request store from localStorage.
 *
 * @returns {Object[]} Array of request records.
 */
function readStore() {
  try {
    const raw = localStorage.getItem(MENTOR_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Persists the mentor-request store to localStorage.
 *
 * @param {Object[]} requests - The store to write.
 * @returns {void}
 */
function writeStore(requests) {
  try {
    localStorage.setItem(MENTOR_REQUESTS_KEY, JSON.stringify(requests));
  } catch (_) {
    /* ignore storage errors */
  }
}

/**
 * Records a new mentorship request.
 *
 * @param {Object} request
 * @param {string} request.mentorId - The mentor identifier.
 * @param {string} request.mentorName - The mentor's display name.
 * @param {string} request.entrepreneurName - The requester's name.
 * @param {string} request.entrepreneurEmail - The requester's email.
 * @param {string} request.entrepreneurPhone - The requester's phone.
 * @param {string} request.message - The request message.
 * @returns {{ request: Object, error: Error|null }}
 */
export function addMentorRequest({
  mentorId,
  mentorName,
  entrepreneurName,
  entrepreneurEmail,
  entrepreneurPhone,
  message,
}) {
  if (!mentorId || !mentorName) {
    return { request: null, error: new Error("Mentor details are required.") };
  }
  if (!entrepreneurName || !message) {
    return { request: null, error: new Error("Your name and message are required.") };
  }

  const requests = readStore();
  const record = {
    id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    mentorId: String(mentorId),
    mentorName,
    entrepreneurName: String(entrepreneurName).trim(),
    entrepreneurEmail: String(entrepreneurEmail || "").trim(),
    entrepreneurPhone: String(entrepreneurPhone || "").trim(),
    message: String(message).trim(),
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  requests.push(record);
  writeStore(requests);
  return { request: record, error: null };
}

/**
 * Lists all mentorship requests, newest first.
 *
 * @returns {Object[]} Array of request records.
 */
export function listMentorRequests() {
  return readStore().sort((a, b) => b.submittedAt - a.submittedAt);
}

/**
 * Counts requests for a specific mentor.
 *
 * @param {string|number} mentorId - The mentor identifier.
 * @returns {number}
 */
export function countRequestsForMentor(mentorId) {
  return readStore().filter((r) => r.mentorId === String(mentorId)).length;
}