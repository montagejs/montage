/**
 * @external RegExp
 */

/**
 * Returns whether the given value is a regexp, regardless of which context it
 * comes from.
 * The context may be another frame.
 *
 * This is the proper idiomatic way to test whether an object is a regexp and
 * replaces the less generally useful `instanceof` check (which does not work
 * across contexts) and the strangeness that the `typeof` a regexp is
 * `"object"`.
 *
 * @function external:RegExp.isRegExp
 * @param value any value
 * @returns {boolean} whether the given value is a regexp
 */
if (!RegExp.isRegExp) {
    var toString = Object.prototype.toString;
    Object.defineProperty(RegExp, "isRegExp", {
        value: function(obj) {
            return toString.call(obj) === "[object RegExp]";
        },
        writable: true,
        configurable: true
    });
}

