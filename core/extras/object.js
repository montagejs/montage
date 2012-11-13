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
    @see [Object class]{@link external:Object}
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
    Returns the value at the end of a property path starting from this object.

    <p>A property path is a dot delimited list of property names and supports
    certain "function calls".  The argument of any function is a property
    path to traverse on each element of a collection of elements.  Indexing
    a property of an array maps to an array of the corresponding property
    of each element in the array.

    @param {String} propertyPath
    @param {Property} unique
    @param {Property} preserve
    @param {Function} visitedComponentCallback
    @param {Array} currentIndex
    @returns result
    @deprecated in favor of upcoming selector evaluator and observer
    interfaces.
    @function external:Object#getProperty
*/
Object.defineProperty(Object.prototype, "getProperty", {
    value: function(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex) {
        var dotIndex,
            result,
            currentPathComponent,
            nextDotIndex,
            remainingPath = null;

        if (aPropertyPath == null) {
            return;
        }

        dotIndex = aPropertyPath.indexOf(".", currentIndex);
        currentIndex = currentIndex || 0;
        currentPathComponent = aPropertyPath.substring(currentIndex, (dotIndex === -1 ? aPropertyPath.length : dotIndex));

        if (currentPathComponent in this) {
            result = this[currentPathComponent];
        } else {
            result = typeof this.undefinedGet === FUNCTION ? this.undefinedGet(currentPathComponent) : undefined;
        }

        if (visitedComponentCallback) {
            nextDotIndex = aPropertyPath.indexOf(".", currentIndex);
            if (nextDotIndex != -1) {
                remainingPath = aPropertyPath.substr(nextDotIndex+1);
            }
            visitedComponentCallback(this, currentPathComponent, result, null, remainingPath);
        }

        if (visitedComponentCallback && result && -1 === dotIndex) {

            // We resolved the last object on the propertyPath, be sure to give the visitor a chance to handle this one
            //visitedComponentCallback(result, null, null, null, null);

        } else if (result && dotIndex !== -1) {
            // We resolved that component of the path, but there's more path components; go to the next

            if (result.getProperty) {
                result = result.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, dotIndex + 1);
            } else {
                // TODO track when this happens, right now it's only happening with CanvasPixelArray in WebKit
                result = Object.prototype.getProperty.call(result, aPropertyPath, unique, preserve, visitedComponentCallback, dotIndex + 1);
            }
        }
        // Otherwise, we reached the end of the propertyPath, or at least as far as we could; stop
        return result;
    },
    writable: true,
    configurable: true
});

// TODO(mczepiel): determine whether the following two memos on the object
// prototype are necessary, and if necessary, document why.

/**
    @private
*/
Object.defineProperty(Object.prototype, "_propertySetterNamesByName", {
    value: {},
    writable: true,
    configurable: true
});

/**
    @private
*/
Object.defineProperty(Object.prototype, "_propertySetterByName", {
    value: {},
    writable: true,
    configurable: true
});

/**
    Sets the value on the end of a property path starting at this object.

    @see external:Object#getProperty
    @member external:Object#setProperty
    @function
    @param {Object} propertyPath
    @param {Object} value
    @returns this
    @deprecated
*/
Object.defineProperty(Object.prototype, "setProperty", {
    value: function(aPropertyPath, value) {
        var propertyIsNumber = !isNaN(aPropertyPath),
            lastDotIndex = propertyIsNumber ? -1 : aPropertyPath.lastIndexOf("."),
            setObject,
            lastObjectAtPath,
            propertyToSetOnArray;

        if (lastDotIndex !== -1) {
            //The propertyPath describes a property that is deeper inside this object
            setObject = this.getProperty(aPropertyPath.substring(0, lastDotIndex));

            if (!setObject) {
                this.undefinedSet(aPropertyPath);
                return;
            }

            aPropertyPath = aPropertyPath.substring(lastDotIndex + 1);
        } else {
            // The property path describes a property on this object
            setObject = this;
        }

        lastObjectAtPath = setObject.getProperty(aPropertyPath);

        // TODO clean up some of the duplicated code here

        if (lastObjectAtPath && Array.isArray(lastObjectAtPath)) {

            if (Array.isArray(setObject)) {
                // If the setObject is an array itself; splice (typically called by set) to trigger bindings, do it here to save time
                propertyToSetOnArray = parseInt(aPropertyPath, 10);
                if (!isNaN(propertyToSetOnArray)) {
                    if (setObject.length < propertyToSetOnArray) {
                        // TODO while I could set the value here I'm setting null and letting the splice,
                        // which we need to do anyway to trigger bindings, do the actual setting
                        setObject[propertyToSetOnArray] = null;
                    }

                    setObject.splice(propertyToSetOnArray, 1, value);

                } else {
                    setObject[aPropertyPath] = value;
                }

            } else {
                setObject[aPropertyPath] = value;
            }

        } else if (Array.isArray(setObject)) {
            // If the setObject is an array itself; splice (typically called by set) to trigger bindings, do it here to save time
            propertyToSetOnArray = parseInt(aPropertyPath, 10);
            if (!isNaN(propertyToSetOnArray)) {
                if (setObject.length < propertyToSetOnArray) {
                    // TODO while I could set the value here I'm setting null and letting the splice,
                    // which we need to do anyway to trigger bindings, do the actual setting
                    setObject[propertyToSetOnArray] = null;
                }
            }
            setObject.splice(propertyToSetOnArray, 1, value);
        } else {
            setObject[aPropertyPath] = value;
        }
    },
    writable: true,
    configurable: true
});

/**
    @member external:Object#parentProperty
    @default null
    @private
*/
Object.defineProperty(Object.prototype, "parentProperty", {
    value: null,
    writable: true,
    configurable: true
});

/**
    Observes when an undefined property has been accessed, but may be
    overridden on other types of objects to return an alternate sensible
    default for the given key, perhaps even memoizing that value by setting it
    before returning.
    @param {Object} key A missing property name on the given object.
    @returns <code>undefined</code>
    @function extenal:Object#undefinedGet
*/
Object.defineProperty(Object.prototype, "undefinedGet", {
    value: function(aPropertyName) {
        console.warn("get undefined property -" + aPropertyName + "-");
    },
    writable: true,
    configurable: true
});

/**
    Observes when an undefined property has been changed.
    @function external:Object#undefinedSet
    @param {Object} aPropertyName The object property name.
*/
Object.defineProperty(Object.prototype, "undefinedSet", {
    value: function(aPropertyName) {
        console.warn("set undefined property -" + aPropertyName + "-");
    },
    writable: true,
    configurable: true
});

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

// TODO migrate from object.clear() to Object.clear(object)
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

