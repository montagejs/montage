/**
    Defines extensions to the intrinsic <code>String</code> object.
    @see {external:String}
	@module montage/core/extras/string
*/

/**
    Returns true if the two strings are equal, otherwise returns false.

    @function external:String#equals
    @param {Object} that The object to compare to the string.
    @returns {Boolean} Returns true if the string is equal to
    <code>that</code>.
*/
Object.defineProperty(String.prototype, "equals", {
    value: function (that) {
        return this.valueOf() === Object.getValueOf(that);
    },
    writable: true,
    configurable: true
});

/**
    Determines whether a substring exists within this string.

    @function external:String#contains
    @param {String} content
    @returns {Boolean} whether this string contains the given content
*/
Object.defineProperty(String.prototype, "contains", {
    value: function (substring) {
        return this.indexOf(substring) !== -1;
    },
    writable: true,
    configurable: true
});

/**
    Capitalizes the first letter in the string.

    @function external:String#toCapitalized
    @returns {String} The original string with its first letter capitalized.
    @example
    var fname = "abe";
    var lname = "lincoln";
    var name = fname.toCapitalized() + " " + lname.toCapitalized();
    // name == "Abe Lincoln"
*/
Object.defineProperty(String.prototype, "toCapitalized", {
    value: function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    writable: true,
    configurable: true
});

// TODO(kriskowal) discover where/whether we are currently using this
/**
    Does nothing, but exists so that strings may be used generically as
    potential event sources.

    @function external:String#addEventListener
    @param {Listener} type The type of event listener.
    @param {Listener} listener The event listener.
    @param {Function} useCapture The capturing function.
*/
Object.defineProperty(String.prototype, "addEventListener", {
    value: Function.noop, // on purpose
    writable: true,
    configurable: true
});

