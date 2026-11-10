/**
 * Escape special regex characters in user-provided string to prevent ReDoS / injection
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = escapeRegex;
