
var M = require("core/core"); // lazy bound because of dependency cycle

var MODIFY = "modify";

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
    enumerable: false
});

/**
  @private
*/
Object.defineProperty(Object.prototype, "_propertySetterNamesByName", {
    value: {}
});

/**
  @private
*/
Object.defineProperty(Object.prototype, "_propertySetterByName", {
    value: {}
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
            if (lastObjectAtPath !== value) {
                // if the value does not match the object described by this propertyPath; set it as the new value

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

            } else {
                // Otherwise, they are the same object, a mutation event probably happened

                // If the object at the property we're "setting" is itself an array, see if there was an event passed along
                // as part of a change and whether we need to call the setObject's changeProperty method
                var changeEvent = this.setProperty.changeEvent, modify;

                // For these mutation/addition/removal events, use the 'modify' attribute of this property's descriptor
                if (changeEvent && (changeEvent.currentTarget.getProperty(changeEvent.currentPropertyPath) === lastObjectAtPath) &&
                    (modify = M.Montage.getPropertyAttribute(setObject, aPropertyPath, MODIFY))) {
                    modify.call(setObject, changeEvent.type, changeEvent.newValue, changeEvent.prevValue);
                }
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
    enumerable: false
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
Object.getPropertyDescriptor = function(anObject, propertyName) {
    var current = anObject,
        currentDescriptor;

    do {
        currentDescriptor = Object.getOwnPropertyDescriptor(current, propertyName);
    } while (!currentDescriptor && (current = current.__proto__ || Object.getPrototypeOf(current)));

    return currentDescriptor;
};

/**
 Returns the prototype object and property descriptor for a property belonging to an object.
 @function external:Object#getPrototypeAndDescriptorDefiningProperty
 @param {Object} anObject The object to return the prototype for.
 @param {String} propertyName The name of the property.
 @returns {Object} An object containing two properties named <code>prototype</code> and <code>propertyDescriptor</code> that contain the object's prototype object and property descriptor, respectively.
 */
Object.getPrototypeAndDescriptorDefiningProperty = function(anObject, propertyName) {
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
};

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
   }
});
