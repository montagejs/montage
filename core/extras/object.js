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
    Defines extensions to intrinsic <code>Object</code>.
    @see {external:Object}
    @module montage/core/extras/object
*/
var M = require("core/core"); // lazy bound because of dependency cycle

var WeakMap = require("collections/weak-map");

// string table, for strings that might be constructed multiple times
// seems to reduce allocations in a version of Firefox I once heard tell
var MODIFY = "modify";
var STRING = "string";
var FUNCTION = "function";

/**
    Returns the descriptor object for an object's property.
    @param {Object} anObject The object containing the property.
    @param {String} propertyName The name of the property.
    @returns {Object} The object's property descriptor.
    @function external:Object.getPropertyDescriptor
*/
Object.defineProperty(Object, "getPropertyDescriptor", {
    value: function(anObject, propertyName) {
        var current = anObject,
            currentDescriptor;

        do {
            currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
        } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

        return currentDescriptor;
    },
    writable: true,
    configurable: true
});

/**
    Returns the prototype object and property descriptor for a property belonging to an object.
    @param {Object} anObject The object to return the prototype for.
    @param {String} propertyName The name of the property.
    @returns {Object} An object containing two properties named <code>prototype</code> and <code>propertyDescriptor</code> that contain the object's prototype object and property descriptor, respectively.
    @function external:Object.getPrototypeAndDescriptorDefiningProperty
*/
Object.defineProperty(Object, "getPrototypeAndDescriptorDefiningProperty", {
    value: function(anObject, propertyName) {
        var current = anObject,
            currentDescriptor;
        if (propertyName) {

            do {
                currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
            } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

            return {
                prototype: current,
                propertyDescriptor: currentDescriptor
            };
        }
    },
    writable: true,
    configurable: true
});

/**
    Removes all properties owned by this object making the object suitable for
    reuse.

    @function external:Object#clear
    @returns this
*/
Object.defineProperty(Object.prototype, "clear", {
    value: function() {
        var keys = Object.keys(this),
            i = keys.length;

        while (i) {
            i--;
            delete this[keys[i]];
        }

        return this;
    },
    writable: true,
    configurable: true
});

Object.defineProperty(Object, "defineBinding", {
    value: function (target, targetPath, descriptor) {
        var depth = Error.stackTraceLimit;
        Error.stackTraceLimit = 2;
        console.warn(
            "Object.defineBinding deprecated.  " +
            "See the comment below this warning for migration instructions.",
            new Error("deprecated").stack
        );
        Error.stackTraceLimit = depth;

        //
        // Migration instructions:
        //
        // Replace Object.defineBinding with
        // import Bindings from "montage/core/bindings"
        // Bindings.defineBinding(target, targetPath, descriptor);
        // - Use "<-", "<->", and "source" in place of
        //   "boundObjectPropertyPath", "oneway", and "boundObject".
        // - Use "convert" or "converter.convert" in place of
        //   "boundValueMutator".
        //

        var Bindings = require("frb");

        descriptor.source = descriptor.boundObject;
        if (descriptor.oneway) {
            descriptor["<-"] = descriptor.boundObjectPropertyPath;
        } else {
            descriptor["<->"] = descriptor.boundObjectPropertyPath;
        }

        if (descriptor.boundValueMutator) {
            descriptor.convert = descriptor.boundValueMutator;
        }

        Bindings.defineBinding(target, targetPath, descriptor);
    }
});

Object.defineProperty(Object, "deleteBinding", {
    value: function (target, targetPath) {
        var Bindings = require("frb");
        Bindings.cancelBinding(target, targetPath);
    }
});

