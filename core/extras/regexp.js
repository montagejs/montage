/* <copyright>
Copyright (c) 2012, António Afonso. All Rights Reserved.
3-Clause BSD License
http://opensource.org/licenses/BSD-3-Clause
</copyright> */
/**
    @external RegExp
*/
/**
    Returns whether the given value is a regexp, regardless of which
    context it comes from.  The context may be another frame.

    <p>This is the proper idiomatic way to test whether an object is a
    regexp and replaces the less generally useful <code>instanceof</code>
    check (which does not work across contexts) and the strangeness that
    the <code>typeof</code> a regexp is <code>"object"</code>.

    @function external:RegExp.isRegExp
    @param {Any} value any value
    @returns {Boolean} whether the given value is a regexp
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

