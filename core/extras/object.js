/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to native Object object.
    @see [Object class]{@link external:Object}
    @module montage/core/extras/object
*/

/**
    @external Object
*/

var M = require("core/core"); // lazy bound because of dependency cycle

var MODIFY = "modify";

// TODO
/**
*/
Object.defineProperty(Object, "empty", {
    value: Object.freeze(Object.create(null)),
    writable: true
});

// TODO
/**
*/
var owns = Object.prototype.hasOwnProperty;
Object.defineProperty(Object, "owns", {
    value: function (object, key) {
        return owns.call(object, key);
    }
});

// TODO
/**
*/
Object.defineProperty(Object, "equals", {
    value: function (a, b) {
        if (typeof a !== typeof b)
            return false;
        if (a === b)
            return true;
        if (typeof a.equals === "function")
            return a.equals(b);
        if (typeof b.equals === "function")
            return b.equals(a);
        return false;
    },
    writable: true
});

// Because a return value of 0 from a `compare` function  may mean either
// "equals" or "is incomparable", `equals` cannot be defined in terms of
// `compare`.  However, `compare` *can* be defined in terms of `equals` and
// `lessThan`.

// TODO
/**
*/
Object.defineProperty(Object, "compare", {
    value: function (a, b) {
        if (typeof a !== typeof b)
            return 0;
        if (a === b)
            return 0;
        if (typeof a === "number")
            return a - b;
        if (typeof a === "string")
            return a < b ? -1 : 1;
            // the possibility of equality elimiated above
        if (a instanceof Date) {
            if (!(b instanceof Date))
                return 0;
            return a - b;
        }
        if (typeof a.compare === "function")
            return a.compare(b);
        if (typeof b.compare === "function")
            return -b.compare(a);
        if (typeof a.equals === "function" && typeof a.lessThan === "function")
            return a.equals(b) ? 0 : (a.lessThan(b) ? -1 : 1);
            // that these parentheses are not necessary is not a fact anyone
            // should be expected to know, so provided here for clarity
        return 0;
    },
    writable: true
});

/**
@function external:Object#getProperty
@param {Object} aPropertyPath
@param {Property} unique
@param {Property} preserve
@param {Function} visitedComponentCallback
@param {Array} currentIndex
@returns result
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
            result = typeof this.undefinedGet === "function" ? this.undefinedGet(currentPathComponent) : undefined;
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
    writable: true
});

// TODO(mczepiel): determine whether the following two memos on the object
// prototype are necessary, and if necessary, document why.

/**
  @private
*/
Object.defineProperty(Object.prototype, "_propertySetterNamesByName", {
    value: {},
    writable: true
});

/**
  @private
*/
Object.defineProperty(Object.prototype, "_propertySetterByName", {
    value: {},
    writable: true
});

/**
Description
@member external:Object#setProperty
@function
@param {Object} aPropertyPath
@param {Object} value
@returns itself
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
    writable: true
});

/**
@member external:Object#parentProperty
@default null
*/
Object.defineProperty(Object.prototype, "parentProperty", {
    enumerable: false,
    value: null,
    writable: true
});

/**
 @function module:montage/core/core.Montage#undefinedGet
 @param {Object} aPropertyName The object property name.
 */
Object.defineProperty(Object.prototype, "undefinedGet", {
    value: function(aPropertyName) {
        console.warn("get undefined property -" + aPropertyName + "-");
    },
    writable: true
});

/**
 @function module:montage/core/core.Montage#undefinedSet
 @param {Object} aPropertyName The object property name.
 */
Object.defineProperty(Object.prototype, "undefinedSet", {
    value: function(aPropertyName) {
        console.warn("set undefined property -" + aPropertyName + "-");
    },
    writable: true
});

/**
 Returns the descriptor object for an object's property.
 @function external:Object#getPropertyDescriptor
 @param {Object} anObject The object containing the property.
 @param {String} propertyName The name of the property.
 @returns {Object} The object's property descriptor.
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
    writable: true
});

/**
 Returns the prototype object and property descriptor for a property belonging to an object.
 @function external:Object#getPrototypeAndDescriptorDefiningProperty
 @param {Object} anObject The object to return the prototype for.
 @param {String} propertyName The name of the property.
 @returns {Object} An object containing two properties named <code>prototype</code> and <code>propertyDescriptor</code> that contain the object's prototype object and property descriptor, respectively.
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
    writable: true
});

/**
 Removes all properties owned by this object making the object suitable for reuse
 @function module:montage/core/core.Object.wipe
 */
Object.defineProperty(Object.prototype, "wipe", {
   value: function() {
       var keys = Object.keys(this),
           i = keys.length;

       while(i) delete this[keys[--i]];

       return this;
   },
   writable: true
});

