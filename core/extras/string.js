/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

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

