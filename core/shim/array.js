/**
    Defines standardized shims to intrinsic <code>Array</code> object.
    @see {external:Array}
    @module montage/core/shim/array
*/

/**
    @external Array
*/

/**
    Returns whether the given value is an array, regardless of which
    context it comes from.  The context may be another frame.

    <p>This is the proper idiomatic way to test whether an object is an
    array and replaces the less generally useful <code>instanceof</code>
    check (which does not work across contexts) and the strangeness that
    the <code>typeof</code> an array is <code>"object"</code>.

    @function external:Array.isArray
    @param {Any} value any value
    @returns {Boolean} whether the given value is an array
*/
if (!Array.isArray) {
    Object.defineProperty(Array, "isArray", {
        value: function(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        },
        writable: true,
        configurable: true
    });
}

