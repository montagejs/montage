/**
 * Defines standardized shims for the intrinsic String object.
 * @see {external:String}
 * @module montage/core/shim/string
 */

/**
 * @external String
 */

/**
 * Returns whether this string begins with a given substring.
 *
 * @function external:String#startsWith
 * @param {string} substring a potential substring of this string
 * @returns {boolean} whether this string starts with the given substring
 */
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function (start) {
            return this.length >= start.length &&
                this.slice(0, start.length) === start;
        },
        writable: true,
        configurable: true
    });
}

/**
 * Returns whether this string ends with a given substring.
 *
 * @function external:String#endsWith
 * @param {string} substring a potential substring of this string
 * @returns {boolean} whether this string ends with the given substring
 */
if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        value: function (end) {
            return this.length >= end.length &&
                this.slice(this.length - end.length, this.length) === end;
        },
        writable: true,
        configurable: true
    });
}

