const mongoose = require("mongoose");

/**
 * Middleware to validate route parameters as valid MongoDB ObjectIds.
 * Returns clean 400 JSON response on invalid ID format.
 *
 * @param {string} [paramName="id"] Parameter name in req.params
 */
function validateObjectId(paramName = "id") {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id !== undefined && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter '${paramName}'`,
      });
    }
    next();
  };
}

module.exports = validateObjectId;
