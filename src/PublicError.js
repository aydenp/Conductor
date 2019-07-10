/**
 * An error message that can be relayed to the user safely.
 */
module.exports = function PublicError(message) {
    this.name = this.constructor.name;
    this.message = message;
    this.isPublic = true;
};
require('util').inherits(module.exports, Error);