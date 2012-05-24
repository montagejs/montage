/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    Defines extensions to native String object.
    @see [String class]{@link external:String}
	@module montage/core/extras/string
*/

/**
    @external String
*/

/**
    String.isString()
    @function external:String.isString()
    @param {object} obj The object to determine if its a String.
    @returns {boolean} Object.prototype.toString.call(obj) === "[object String]"
*/
Object.defineProperty(String, "isString", {
    value: function(obj) {
        return Object.prototype.toString.call(obj) === "[object String]";
    },
    writable: true
});

// TODO
/**
    Returns true if the two strings are equal, otherwise returns false.
    @function external:String.equals
    @param {Object} anObject The object to compare to the string.
    @returns {Boolean} Returns true if the string is equal to <code>anObject</code>.
*/
Object.defineProperty(String.prototype, "equals", {
    value: function (that) {
        return this.valueOf() === that;
    },
    writable: true
});

// TODO
/**
 */
Object.defineProperty(String.prototype, "contains", {
    value: function (substring) {
        return this.indexOf(substring) !== -1;
    },
    writable: true
});

/**
    Capitalizes the first letter in the string.
    @function external:String.toCapitalized
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
    writable: true
});

/**
    @function external:String.addEventListener
    @param {Listener} type The type of event listener.
    @param {Listener} listener The event listener.
    @param {Function} useCapture The capturing function.
*/
Object.defineProperty(String.prototype, "addEventListener", {
    value: Function.noop, // on purpose
    writable: true
});

