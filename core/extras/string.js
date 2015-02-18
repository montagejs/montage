
/**
 * Defines extensions to the intrinsic `String` object.
 * @see {external:String}
 * @module montage/core/extras/string
 */

/**
 * Returns true if the two strings are equal, otherwise returns false.
 *
 * @function external:String#equals
 * @param {Object} that The object to compare to the string.
 * @returns {boolean} Returns true if the string is equal to
 * `that`.
 */
Object.defineProperty(String.prototype, "equals", {
    value: function (that) {
        return this.valueOf() === Object.getValueOf(that);
    },
    writable: true,
    configurable: true
});

/**
 * Determines whether a substring exists within this string.
 *
 * @function external:String#contains
 * @param {string} content
 * @returns {boolean} whether this string contains the given content
 */
Object.defineProperty(String.prototype, "contains", {
    value: function (substring) {
        return this.indexOf(substring) !== -1;
    },
    writable: true,
    configurable: true
});

/**
 * Capitalizes the first letter in the string.
 *
 * @function external:String#toCapitalized
 * @returns {string} The original string with its first letter capitalized.
 * @example
 * var fname = "abe";
 * var lname = "lincoln";
 * var name = fname.toCapitalized() + " " + lname.toCapitalized();
 * // name == "Abe Lincoln"
 */
Object.defineProperty(String.prototype, "toCapitalized", {
    value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    writable: true,
    configurable: true
});

