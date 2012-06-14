/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to native Array object.
    @see [Array class]{@link external:Array}
    @module montage/core/shim/array
*/
/**
    @external Array
*/

/**
    @function external:Array#equals
    @param {object} right The object to compare.
    @returns {Boolean} true or false
*/
if (!Array.prototype.equals) {
    Object.defineProperty(Array.prototype, "equals", {
        value: function (right) {
            var i = 0,
                length = this.length,
                lhs,
                rhs;

            if (this === right) {
                return true;
            }

            if (!right || !Array.isArray(right)) {
                return false;
            }

            if (length !== right.length) {
                return false;
            } else {
                for (; i < length; ++i) {
                    if (i in this) {
                        lhs = this[i],
                            rhs = right[i];

                        if (lhs !== rhs && (lhs && rhs && !lhs.equals(rhs))) {
                            return false;
                        }
                    } else {
                        if (i in right) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
    });
}
Object.defineProperty(Array, "isCanvasPixelArray", {
    value: function(obj) {
        return Object.prototype.toString.call(obj) === "[object CanvasPixelArray]";
    }
});

/**
Description
@member external:Array#getProperty
@function
@param {Object} aPropertyPath
@param {Property} unique
@param {Property} preserve
@param {Function} visitedComponentCallback
@param {Array} currentIndex
*/
var _index_array_regexp = /^[0-9]+$/;
Object.defineProperty(Array.prototype, "getProperty", {
    value: function(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex) {

        if (aPropertyPath == null) {
            return;
        }

        currentIndex = currentIndex || 0;

        var result,
            propertyIsNumber = _index_array_regexp.test(aPropertyPath),//!isNaN(aPropertyPath),
            parenthesisStartIndex = propertyIsNumber ? -1 : aPropertyPath.indexOf("(", currentIndex),
            parenthesisEndIndex = propertyIsNumber ? -1 : aPropertyPath.lastIndexOf(")"),
            currentPathComponentEndIndex = propertyIsNumber ? -1 : aPropertyPath.indexOf(".", currentIndex),
            nextDelimiterIndex = -1,
            itemResult,
            index,
            currentPathComponent,
            functionName,
            functionArgPropertyPath,
            tmpResult,
            uniques;

        // PARSE: Determine the indices of the currentPathComponent we're concerned with

        if (currentPathComponentEndIndex > -1 && parenthesisStartIndex > -1) {
            // We have both a dot and an open parenthesis somewhere in the path, figure out the next path component
            if (currentPathComponentEndIndex > parenthesisStartIndex) {
                // The next dot was actually inside the function call; use the entire function call: foo.bar(a.b.c) -> bar(a.b.c)
                nextDelimiterIndex = parenthesisEndIndex + 1;
                functionName = aPropertyPath.substring(currentIndex, parenthesisStartIndex);
            } else {
                // The next dot comes before the start of the function parenthesis; use the dot: foo.bar(a.b.c) -> foo
                nextDelimiterIndex = currentPathComponentEndIndex;
            }
        } else {
            // We have either a dot, parenthesis, or neither
            if (parenthesisStartIndex > -1) {
                // we had a starting parenthesis; use the END parenthesis to include the entire function call
                nextDelimiterIndex = parenthesisEndIndex + 1;
                functionName = aPropertyPath.substring(currentIndex, parenthesisStartIndex);
            } else {
                nextDelimiterIndex = currentPathComponentEndIndex;
            }
        }

        // Find the component of the propertyPath we want to deal with during this particular invocation of this function
        currentPathComponent = propertyIsNumber ? aPropertyPath : aPropertyPath.substring(currentIndex, (nextDelimiterIndex === -1 ? aPropertyPath.length : nextDelimiterIndex));

        // EVALUATE: Determine the value of the currentPathComponent

        if (functionName) {
            // We have a function to execute as part of this propertyPath; execute it assuming that it will know
            // how to handle the property path being passed along

            // TODO do we call this before or after finding the result (probably before to maintain the chain
            // of one invocation's discovered value being the context of the next invocation
            if (visitedComponentCallback) {
                visitedComponentCallback(this, functionName + "()", null, null, null);
            }

            functionArgPropertyPath = aPropertyPath.substring(parenthesisStartIndex + 1, parenthesisEndIndex);
            result = this[functionName](functionArgPropertyPath, visitedComponentCallback);


        } else {

            // TODO we don't provide any way to access properties that are actually accessible on the array itself
            // we assume that by default, any property in a propertyPath after an array refers to a property
            // you are interested in getting on each member of the array

            if (isNaN(currentPathComponent)) {

                if (visitedComponentCallback) {
                    //console.log("....",  currentPathComponent, aPropertyPath , currentPathComponentEndIndex != -1 ? aPropertyPath.slice(currentPathComponentEndIndex + 1) : null);
                    //console.log(aPropertyPath.slice(currentIndex));
                    visitedComponentCallback(this, null, undefined, null, aPropertyPath.slice(currentIndex));
                }

                result = [];
                index = 0;

                // The currentPathComponent is some property not directly on this array, and not an index in the array
                // so we'll be getting an array of resolving this currentPathComponent on each member in the array
                if (preserve) {

                    while((itemResult = this[index]) != null) {
                        result[index] = itemResult.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex);
                        index++;
                    }

                } else {

                    // TODO in either case, why do we stop if we encounter null|undefined? there could be useful
                    // values after that in the collection. I already had to fix an issue here where a zero
                    // would short-circuit the loop
                    while((itemResult = this[index]) != null) {
                        tmpResult = itemResult.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, currentIndex);

                        if (Array.isArray(tmpResult)) {
                            result = result.concat(tmpResult);
                        } else {
                            result[index] = tmpResult;
                        }
                        index++;
                    }

                    if (unique) {
                        var uniques = {}; // TODO reuse this object if possible
                        // TODO don't recreate this filter function each time
                        result = result.filter(function(element) {
                            return uniques[element] ? false : (uniques[element] = true);
                        });
                    }

                }

            } else {

                // The currentPathComponent is an index into this array
                result = this[currentPathComponent];


                if (visitedComponentCallback) {
                    visitedComponentCallback(this, currentPathComponent, result, null, currentPathComponentEndIndex != -1 ? aPropertyPath.slice(currentPathComponentEndIndex + 1) : null);
                }

                if (currentPathComponentEndIndex > 0) {
                    result = result ? result.getProperty(aPropertyPath, unique, preserve, visitedComponentCallback, currentPathComponentEndIndex + 1) : undefined;
                } else if (visitedComponentCallback && currentPathComponentEndIndex === -1 && result) {
                    // If we're at the end of the path, but have a result, visit it
                    //visitedComponentCallback(result, null, null, null, null);
                }
            }
        }

        return result;
    },
    enumerable: false
});

/**
@member external:Array#count
@function
@returns this.length
*/
Object.defineProperty(Array.prototype, "count", {
    value: function() {
        return this.length;
    }
});

/**
Description
@member external:Array#any
@function
@param {Object} propertyPath
@param {Function} visitedCallback
@returns result
*/
Object.defineProperty(Array.prototype, "any", {
    value: function(propertyPath, visitedCallback) {
        var result;
        if (propertyPath) {
            result = this.some(function(value) {
                return !!value.getProperty(propertyPath, null, null, visitedCallback);
            });
        } else {
            result = this.some(function(value) {
                return !!value;
            });
        }
        return result;
    }
});

/**
Description
@function external:Array#sum
@param {Object} propertyPath
@param {Function} visitedCallback
@returns sum
*/
Object.defineProperty(Array.prototype, "sum", {
    value: function(propertyPath, visitedCallBack) {
        var sum = 0, result, resultSum;
        if (propertyPath) {
            this.map(function(value) {
                result = value.getProperty(propertyPath, null, null, visitedCallBack);
                if (Array.isArray(result)) {
                    resultSum = 0;
                    result.map(function(value) {
                        return (resultSum += Number(value));
                    });
                    result = resultSum;
                }
                return (sum += Number(result));
            });
        }
        else {
            this.map(function(value) {
                return (sum += Number(value));
            });
        }
        return sum;
    }
});

/**
 Removes all members of this array making the object suitable for reuse
 @function module:montage/core/core.Array.wipe
 */
Object.defineProperty(Array.prototype, "wipe", {
   value: function() {
       this.length = 0;
       return this;
   }
});
