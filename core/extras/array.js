/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to native Array object.
    @see [Array class]{@link external:Array}
    @module montage/core/extras/array
*/

/**
    @external Array
*/

/**
    @function external:Array#equals
    @param {object} that The object to compare.
    @returns {Boolean} true or false
*/
Object.defineProperty(Array.prototype, "equals", {
    value: function (that) {
        var i = 0,
            length = this.length,
            lhs,
            rhs;

        if (this === that) {
            return true;
        }

        if (!that || !Array.isArray(that)) {
            return false;
        }

        if (length !== that.length) {
            return false;
        } else {
            for (; i < length; ++i) {
                if (i in this) {
                    lhs = this[i],
                        rhs = that[i];

                    if (lhs !== rhs && (lhs && rhs && !lhs.equals(rhs))) {
                        return false;
                    }
                } else {
                    if (i in that) {
                        return false;
                    }
                }
            }
        }
        return true;
    },
    writable: true
});

/**
    @function external:Array#compare
    @param {object} right The object to compare.
    @returns {Number} related to zero in the same way as left is to right
*/
Object.defineProperty(Array.prototype, "compare", {
    value: function (that) {
        var i,
            length,
            lhs,
            rhs,
            relative;

        if (this === that) {
            return 0;
        }

        if (!that || !Array.isArray(that)) {
            return 1;
        }

        length = Math.min(this.length, that.length);

        for (i = 0; i < length; i++) {
            if (i in this) {
                if (!(i in that)) {
                    return 1;
                } else {
                    lhs = this[i];
                    rhs = that[i];
                    relative = Object.compare(lhs, rhs);
                    if (relative) {
                        return relative;
                    }
                }
            } else if (i in that) {
                return -1;
            }
        }

        return this.length - that.length;
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "get", {
    value: function (index) {
        return this[index];
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "set", {
    value: function (index, value) {
        this.setProperty(index, value); // TODO subsume this functionality
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "has", {
    value: function (value) {
        return this.indexOf(value) !== -1;
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "add", {
    value: function (value) {
        if (!this.has(value)) {
            this.push(value);
        }
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "delete", {
    value: function (value) {
        var index = this.indexOf(value);
        if (index !== -1) {
            this.splice(index, 1);
        }
    },
    writable: true
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
    writable: true
});

/**
@member external:Array#count
@function
@returns this.length
*/
Object.defineProperty(Array.prototype, "count", {
    value: function() {
        return this.length;
    },
    writable: true
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
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "all", {
    value: function() {
        return this.every(function (value) {
            return !!value;
        });
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "min", {
    value: function() {
        return Math.min.apply(Math, this);
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "max", {
    value: function() {
        return Math.max.apply(Math, this);
    },
    writable: true
});

/**
Description
@function external:Array#sum
@param {Object} propertyPath
@param {Function} visitedCallback
@returns sum
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
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "average", {
    value: function () {
        return this.sum() / this.count();
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "unique", {
    value: function (equals) {
        var equals = Object.equals;
        var unique = [];
        this.forEach(function (value) {
            if (unique.every(function (other) {
                return !equals(value, other);
            })) {
                unique.push(value);
            }
        }, this);
        return unique;
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "flatten", {
    value: function () {
        return this.reduce(function (flat, row) {
            return flat.concat(row);
        }, []);
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "one", {
    value: function () {
        if (this.length === 0) {
            throw new Error("Can't get one element from empty array");
        }
        return this[0];
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "only", {
    value: function () {
        if (this.length !== 1) {
            throw new Error(
                "Can't get only element of array with " +
                this.length + " elements."
            );
        }
        return this[0];
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "startsWith", {
    value: function (start) {
        return (
            this.length >= start.length &&
            this.slice(0, start.length).equals(start)
        );
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Array.prototype, "endsWith", {
    value: function (end) {
        return (
            this.length >= end.length &&
            this.slice(this.length - end.length, this.length)
                .equals(end)
        );
    },
    writable: true
});

/**
    Produces a sorted version of an array, with a sensible default comparator,
    and the ability to perform a "Schwartzian Transform" so that the compared
    property of each element of the array only needs to be computed once per
    element.
    @param {Function} compare a comparator that returns a number describing the
    transitive relationship between the two given arguments.  The number will
    have the same relationship to zero (equals, less than, greater than, &c) as
    the numbers have to each other.  The comparator may by an object with
    `compare` and `by` properties, where the `compare` is a comparator and `by`
    is a "mapping" function that accepts an element of the array and returns
    the property by which to sort it.  The default comparator is
    `Object.compare`.
    @param {Function} by is a "mapping" function for each element of the array.
    The default mapping is `Function.identity`.
    @returns a new array with the values from the original array in
    the specified sorted order.
*/
Object.defineProperty(Array.prototype, "sorted", {
    value: function (compare, by, order) {
        compare = compare || Object.compare;
        // account for comparators generated by Function.by
        by = by || compare.by || Function.identity;
        compare = compare.compare || compare;
        if (order === undefined)
            order = 1;
        return this.map(function (item) {
            return {
                by: by(item),
                value: item
            };
        })
        .sort(function (a, b) {
            return Object.compare(a.by, b.by) * order;
        })
        .map(function (pair) {
            return pair.value;
        })
    },
    writable: true
});

/**
    Removes all members of this array making the object suitable for reuse.
    Assumes that the array has no other named properties.
    @function module:montage/core/core.Array.wipe
*/
Object.defineProperty(Array.prototype, "wipe", {
   value: function() {
       this.length = 0;
       return this;
   },
   writable: true
});

Object.defineProperty(Array, "isCanvasPixelArray", {
    value: function(obj) {
        return Object.prototype.toString.call(obj) === "[object CanvasPixelArray]";
    },
    writable: true
});

