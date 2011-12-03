/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to native String object.
    @see [String class]{@link external:String}
	@module montage/core/shim/string
*/

/**
 @external String
 */
Object.defineProperties(String.prototype, /** @lends external:String.prototype#*/{
    /**
    @function external:String.addEventListener
    @param {Listener} type The type of event listener.
    @param {Listener} listener The event listener.
    @param {Function} useCapture The capturing function.
    */
    addEventListener: {
        value: function(type, listener, useCapture) {
            //NO OP, on purpose
        }

    },
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
    toCapitalized: {
        value: function() {
            return this.charAt(0).toUpperCase() + this.slice(1);
        }
    },

    /**
     Returns true if the two strings are equal, otherwise returns false.
     @function external:String.equals
     @param {Object} anObject The object to compare to the string.
     @returns {Boolean} Returns true if the string is equal to <code>anObject</code>.
     */
    equals: {
        value: function(anObject) {
            if (this.toString() === anObject) {
                return true;
            }

            if (!anObject || !(anObject instanceof String)) {
                return false;
            }

            return (this == anObject);
        }
    }

});


