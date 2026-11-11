/**
 * Mongoose Plugin for Transparent Soft Deletes
 * - Adds deletedAt and deletedBy fields
 * - By default, excludes documents where deletedAt != null in find, findOne, findOneAndUpdate, countDocuments
 * - Can be bypassed by passing { includeDeleted: true } in query options
 */

function softDeletePlugin(schema) {
  schema.add({
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: schema.constructor.Types.ObjectId,
      ref: "User",
      default: null,
    },
  });

  // Pre-find hook
  schema.pre(/^find/, function () {
    if (this.getOptions().includeDeleted) {
      return;
    }
    this.where({ deletedAt: null });
  });

  // Pre-countDocuments hook
  schema.pre("countDocuments", function () {
    if (this.getOptions().includeDeleted) {
      return;
    }
    this.where({ deletedAt: null });
  });

  // Instance method to soft delete
  schema.methods.softDelete = function (userId) {
    this.deletedAt = new Date();
    if (userId) {
      this.deletedBy = userId;
    }
    return this.save();
  };

  // Instance method to restore
  schema.methods.restore = function () {
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };
}

module.exports = softDeletePlugin;

