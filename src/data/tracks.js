/**
 * @file Certificate tracks.
 * @description Groups the 15 learning modules into three stackable
 * certificates. A certificate is earned automatically when every module
 * in a track is complete, which is what the user dashboard's "Progress &
 * Certificates" section tracks.
 */

/**
 * @typedef {Object} CertificateTrack
 * @property {string} id - Track identifier.
 * @property {string} name - Track title shown on the certificate.
 * @property {string} description - What the track covers.
 * @property {number[]} moduleIds - Course ids that must be completed.
 * @property {string} accent - Accent colour used on the certificate card.
 */

/**
 * The certificate tracks.
 *
 * @type {CertificateTrack[]}
 */
export const CERTIFICATE_TRACKS = [
  {
    id: "business-basics",
    name: "Certified Small Business Starter",
    description:
      "The essentials of running a business: what it is, how you think like an owner, and how you reach customers.",
    moduleIds: [2, 8, 15],
    accent: "#0A8791",
  },
  {
    id: "financial-confidence",
    name: "Certified Financial Manager",
    description:
      "Keep the books, understand margins and cash flow, and stay SARS-ready without a fear of the tax office.",
    moduleIds: [6, 4, 12, 1, 10],
    accent: "#16a34a",
  },
  {
    id: "growth-leadership",
    name: "Certified Growth & Leadership Lead",
    description:
      "Grow the customer base, read the data, negotiate well, and lead the team and the 12-month plan.",
    moduleIds: [5, 7, 11, 13, 14, 3, 9],
    accent: "#d4af37",
  },
];

/**
 * Looks up a track by id.
 *
 * @param {string} trackId - The track identifier.
 * @returns {CertificateTrack|null}
 */
export function getTrackById(trackId) {
  return CERTIFICATE_TRACKS.find((track) => track.id === trackId) || null;
}

export default { CERTIFICATE_TRACKS, getTrackById };
