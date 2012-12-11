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
    Defines extensions to the intrinsic <code>Array</code> object.
    @see [Array]{@link external:Array}
    @module montage/core/extras/array
*/

/**
    Returns the value at the end of a property path starting from this array.

    <p>A property path is a dot delimited list of property names and supports
    certain "function calls".  The argument of any function is a property
    path to traverse on each element of a collection of elements.  Indexing
    a property of an array maps to an array of the corresponding property
    of each element in the array.

    @function external:Array#getProperty
    @deprecated in favor of upcoming selector evaluator and observer
    @param {Object} propertyPath
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
    writable: true,
    configurable: true
});

// TODO(kriskowal) do we actually need this? other types of collections could
// implement length as a getter
/**
    Returns the length of the array.  The purpose of this method is to provide
    a generic way to access the quantity of elements in any collection.

    @function external:Array#count
    @returns the length of this array
*/
Object.defineProperty(Array.prototype, "count", {
    value: function() {
        return this.length;
    },
    writable: true,
    configurable: true
});

// XXX this implementation is deprecated but presently required for bindings
// with the visited callback
/**
    Returns whether any element (or property of each element) is truthy.
    @function external:Array#any
    @deprecated The property path and visited callback are deprecated in
    anticipation of alternatives made available through selector evaluators and
    observers.
    @param {Object} propertyPath
    @param {Function} visitedCallback
    @returns {Boolean} whether any single value in the array (or property of
    that element) is truthy.
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
    },
    writable: true,
    configurable: true
});

// TODO this implementation is deprecated (can be removed and will
// automatically be replaced by the implementation in collections/shim).  It is
// retained for serving the present bindings implementation for sum(visitor).
/**
    Returns the sum of all values in the array.

    <p>Treats a nested array value as the sum of the array, recursively.
    Delegates to a property of the array if given, with an optional visitor for
    each element of the array.

    @function external:Array#sum
    @deprecated The property path and visitor callback are deprecated in favor
    of equivalent functionality provided by selector evaluators and observers.
    The implicit recursive flattening of contained arrays is also deprecated
    since selectors support explicit flattening.
    @param {Object} propertyPath
    @param {Function} visitedCallback
    @returns {Number} the sum of every value in the array
*/
Object.defineProperty(Array.prototype, "sum", {
    value: function(propertyPath, visitedCallback) {
        if (propertyPath) { // follow property paths XXX deprecated in favor of selector
            return this.map(function (value) {
                return value.getProperty(propertyPath, null, null, visitedCallback);
            }).sum();
        } else {
            return this.reduce(function(sum, value) {
                if (Array.isArray(value)) { // implicitly flatten arrays XXX deprecated
                    value = value.sum();
                }
                return sum + value;
            }, 0);
        }
    },
    writable: true,
    configurable: true
});

// TODO(kriskowal) determine whether this has been deprecated and remove
/**
    Returns whether an object is a canvas pixel array

    @function external:Array.isCanvasPixelArray
    @deprecated in favor of typed arrays in recent browsers
    @param {Object} some object
    @returns {Boolean} whether it is a canvas pixel array
*/
Object.defineProperty(Array, "isCanvasPixelArray", {
    value: function(obj) {
        return Object.prototype.toString.call(obj) === "[object CanvasPixelArray]";
    },
    writable: true,
    configurable: true
});

