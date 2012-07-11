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
    Returns whether this array is equivalent to another.  Arrays with the same
    length and equivalent respective properties are equivalent.   Arrays are
    only equivalent to other arrays.  Equivalence is otherwise defined by
    <code>Object.equals</code> which is applied recursively.

    @function external:Array#equals
    @param {object} that The object to compare.
    @returns {Boolean} whether the arrays are equivalent
*/
Object.defineProperty(Array.prototype, "equals", {
    value: function (that, equals) {
        var equals = equals || Object.equals,
            i = 0,
            length = this.length,
            lhs,
            rhs;

        if (this === that) {
            return true;
        }

        if (!that || !Array.isArray(that)) {
            if (Object.implements(that, "reduce")) {
                var self = this;
                return (
                    this.length === that.length &&
                    that.reduce(function (basis, value, index) {
                        return (
                            basis &&
                            index in self &&
                            equals(
                                self[index],
                                value
                            )
                        );
                    }, true)
                );
            } else {
                return false;
            }
        }

        if (length !== that.length) {
            return false;
        } else {
            for (; i < length; ++i) {
                if (i in this) {
                    lhs = this[i],
                        rhs = that[i];

                    if (lhs !== rhs && (lhs && rhs && !equals(lhs, rhs))) {
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
    writable: true,
    configurable: true
});

/**
    Returns where this array should be sorted in relation to another object, by
    virtue of an analogy.  The returned number has the same relationship to
    zero as this array to the other, for relationships like "less than" and
    "equals".  Returns zero if the other object is not comparable, so
    non-arrays are sorted stably.

    <p>Arrays are compared by the first diverging values, or by length.
    Comparison recurs on each value.

    @function external:Array#compare
    @param {Any} that Another value
    @param {Function} compare an alternate comparison function for each
    respective value of this and that array, defaults to
    <code>Object.compare</code>
    @returns {Number} related to zero in the same way as left is to right
*/
Object.defineProperty(Array.prototype, "compare", {
    value: function (that, compare) {
        var compare = compare || Object.compare,
            i,
            length,
            lhs,
            rhs,
            relative;

        if (this === that) {
            return 0;
        }

        if (!that || !Array.isArray(that)) {
            if (Object.implements(that, "reduce")) {
                var self = this;
                var length = Math.min(this.length, that.length);
                var comparison = that.reduce(function (comparison, value, index) {
                    if (comparison === 0) {
                        if (index >= length) {
                            return comparison;
                        } else {
                            return compare(self[index], that[index]);
                        }
                    } else {
                        return comparison;
                    }
                }, 0);
                if (comparison === 0) {
                    return this.length - that.length;
                }
            } else {
                return 1;
            }
        }

        length = Math.min(this.length, that.length);

        for (i = 0; i < length; i++) {
            if (i in this) {
                if (!(i in that)) {
                    return 1;
                } else {
                    lhs = this[i];
                    rhs = that[i];
                    relative = compare(lhs, rhs);
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
    writable: true,
    configurable: true
});

/**
    Returns the value at the corresponding index.
    Although this replicates the behavior of accessing an element with
    bracket notation, the purpose of this method is to permit collection
    objects to be used generically, including sets and lists.

    <p>This method is not intended to be used to access named
    properties of an array and as such will throw a type error.

    @function external:Array#get
    @param {Number} index
    @returns {Any} the value at the corresponding index
*/
Object.defineProperty(Array.prototype, "get", {
    value: function (index) {
        if (+index !== index)
            throw new Error("Indicies must be numbers");
        return this[index];
    },
    writable: true,
    configurable: true
});

/**
    Changes the value for the corresponding index, resizing the Array to
    include the index if necessary.  Also notifies any observers of the array
    of the corresponding change.

    <p>Use this method instead of bracketed index assignment if this array is
    being observed.  Bracketed assignment is not observable.

    <p>This method is not intended to be used to modify named
    properties of an array and as such will throw a type error.

    <p>Although this replicates the behavior of assigning an element with
    bracket notation, the purpose of this method is to permit collection
    objects to be used generically, including sets and lists.

    @function external:Array#set

    @param {Number} index
    @param {Any} value
    @returns <code>undefined</code>
*/
Object.defineProperty(Array.prototype, "set", {
    value: function (index, value) {
        if (+index !== index)
            throw new Error("Indicies must be numbers");
        this.setProperty(index, value); // TODO(kriskowal) subsume this functionality
    },
    writable: true,
    configurable: true
});

/**
    Similar to <code>indexOf</code>, <code>find</code> returns the first index
    occupying a given value, or <code>-1</code> failing to find one.  The
    function differs from <code>indexOf</code> because it uses
    <code>Object.equals</code> by default to determine whether a value in the
    array matches the given value.  By contrast, <code>indexOf</code> uses
    <code>===</code>.  <code>find</code> can also accept an alternate equality
    operator like <code>Object.is</code> for finding only identical values.

    @function external:Array#find
    @param {Any} value the sought value
    @param {Function} equals an optional alternate equality comparison
    function, accepting two arguments.  The default is
    <code>Object.equals</code>.
    @returns {Number} the first index at which an equivalent value resides in
    this array, or <code>-1</code> if there is none.
*/
Object.defineProperty(Array.prototype, "find", {
    value: function (value, equals) {
        equals = equals || Object.equals;
        for (var index = 0; index < this.length; index++) {
            if (index in this && equals(this[index], value)) {
                return index;
            }
        }
        return -1;
    },
    writable: true,
    configurable: true
});

/**
    Similar to <code>lastIndexOf</code>, <code>findLast</code> returns the last
    index occupying a given value, or <code>-1</code> failing to find one.  The
    function differs from <code>lastIndexOf</code> because it uses
    <code>Object.equals</code> by default to determine whether a value in the
    array matches the given value.  By contrast, <code>indexOf</code> uses
    <code>===</code>.  <code>find</code> can also accept an alternate equality
    operator like <code>Object.is</code> for finding only identical values.

    @function external:Array#findLast
    @param {Any} value the sought value
    @param {Function} equals an optional alternate equality comparison
    function, accepting two arguments.  The default is
    <code>Object.equals</code>.
    @returns {Number} the last index at which an equivalent value resides in
    this array, or <code>-1</code> if there is none.
*/
Object.defineProperty(Array.prototype, "findLast", {
    value: function (value, equals) {
        equals = equals || Object.equals;
        var index = this.length;
        do {
            index--;
            if (index in this && equals(this[index], value)) {
                return index;
            }
        } while (index > 0);
        return -1;
    },
    writable: true,
    configurable: true
});

/**
    Determines whether a value exists within the array.  This is intended to
    replace the idiom:

    <pre>array.find(value) !== -1</pre>

    <p>Although this replicates the above behavior, the purpose of this method
    is to permit collection objects to be used generically, particularly sets
    since these have no concept of position.

    @function external:Array#has
    @param {Any} value
    @param {Function} equals optional alternative to <code>Object.equals</code>
    for determining whether a value matches the given value.
    <code>Object.is</code> is particularly useful for restricting the query to
    find only absolutely identical values.
    @returns {Boolean} whether the value exists in the array
*/
Object.defineProperty(Array.prototype, "has", {
    value: function (value, equals) {
        return this.find(value, equals) !== -1;
    },
    writable: true,
    configurable: true
});

/**
    As if the array were a set, adds an element to the end of the array if it
    does not yet exist elsewhere.  This method permits arrays and sets to be
    used generically, albeit with <strong>terrible</strong> performance
    for large arrays.

    @function external:Array#add
    @param {Any} value
*/
Object.defineProperty(Array.prototype, "add", {
    value: function (value, equals) {
        if (!this.has(value, equals)) {
            this.push(value);
        }
    },
    writable: true,
    configurable: true
});

/**
    As if the array were a set, removes an element with the given value (as
    discovered by <code>find</code>.  All following values migrate forward by
    one index.  Nothing happens if a matching value is not found.
    @function external:Array#delete
    @param {Any} value
*/
Object.defineProperty(Array.prototype, "delete", {
    value: function (value, equals) {
        var index = this.find(value, equals);
        if (index !== -1) {
            this.splice(index, 1);
        }
    },
    writable: true,
    configurable: true
});

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

/**
    Returns whether every element of the array is truthy.
    @function external:Array#all
    @returns {Boolean} whether every value in the array is truthy
*/
Object.defineProperty(Array.prototype, "all", {
    value: function() {
        return this.every(function (value) {
            return !!value;
        });
    },
    writable: true,
    configurable: true
});

/**
    From an array of numbers, returns which number is closest to negative
    infinity.
    @function external:Array#min
    @returns {Number} the smallest number
*/
Object.defineProperty(Array.prototype, "min", {
    value: function() {
        return Math.min.apply(Math, this);
    },
    writable: true,
    configurable: true
});

/**
    From an array of numbers, returns which number is closest to infinity.

    @function external:Array#max
    @returns {Number} the largest number
*/
Object.defineProperty(Array.prototype, "max", {
    value: function() {
        return Math.max.apply(Math, this);
    },
    writable: true,
    configurable: true
});

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

/**
    Returns the average of all numbers in the array.

    <p>This method is suitably generic that it can be added to any collection
    that implements <code>sum</code> and <code>count</code>.

    @function external:Array#average
    @returns {Number} the average value in the array.
*/
Object.defineProperty(Array.prototype, "average", {
    value: function () {
        return this.sum() / this.count();
    },
    writable: true,
    configurable: true
});

/**
    Returns an array containing every unique value from the original array.
    A value is unique if there is no other equivalent value in the array.
    Equivalence is gauged by <code>Object.equals</code>, which compares for
    deep, polymorphic, type-sensitive equality.

    <p>The complexity of <code>unique</code> linear.

    @function external:Array#unique
    @returns {Array} unique values from this array
*/
Object.defineProperty(Array.prototype, "unique", {
    value: function (equals) {
        var unique = [];
        this.forEach(function (value) {
            // implicitly ascertains that the value does
            // not already exist in the new array
            unique.add(value, equals);
        });
        return unique;
    },
    writable: true,
    configurable: true
});

/**
    Assuming that this is an array of arrays, returns an array of those arrays
    concatenated.  This is not recursive; only two dimensions are flattened
    into one.

    <p>This is suitably generic that any collections that implement
    <code>reduce</code> and <code>forEach</code> may use it, both
    for the outer and inner array, though it unconditionally
    returns an array.

    @function external:Array#flatten
    @returns {Array} a linear array from the planar array
*/
// TODO(kriskowal) add a depth argument, infinity by default
Object.defineProperty(Array.prototype, "flatten", {
    value: function (depth) {
        return this.reduce(function (flat, row) {
            row.forEach(function (value) {
                flat.push(value);
            });
            return flat;
        }, []);
    },
    writable: true,
    configurable: true
});

/**
    So that arrays and sets may be used interchangably, allows us to pick one
    element from the array.  If no elements are available, throws an exception.
    The picked element of an unordered set is not necessarily deterministic,
    but for an array, we return the first element.

    @function external:Array#one
    @returns {Any} the first element of the array
*/
Object.defineProperty(Array.prototype, "one", {
    value: function () {
        if (this.length === 0) {
            throw new Error("Can't get one element from empty array");
        }
        return this[0];
    },
    writable: true,
    configurable: true
});

/**
    So that arrays and sets may be used interchangably, allows us to pick the
    one and only element from an array with only that element.  If other
    elements exist, throws an exception.

    @function external:Array#only
    @returns {Any} the only element of an array
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
    writable: true,
    configurable: true
});

/**
    Produces a sorted version of an array, with a sensible default comparator,
    and the ability to perform a "Schwartzian Transform" so that the compared
    property of each element of the array only needs to be computed once per
    element.

    <p>The <code>compare</code> argument may be an object with a
    <code>by</code> property instead of a plain comparator function.  The
    <code>by</code> function will be used to find a representative value
    for each element in this array on which to sort the values.  The
    object may also have an alternate <code>compare</code> method to use
    to sort the representative values.  Comparators returned by
    <code>Function.by</code> have these properties to reduce the number of
    times the <code>by</code> relation function needs to be called to just
    once per sorted object.

    @function external:Array#sorted
    @param {Function} compare a comparator that returns a number
    describing the transitive relationship between the two given
    arguments.  The number will have the same relationship to zero
    (equals, less than, greater than, &c) as the numbers have to each
    other.  The comparator may by an object with <code>compare</code> and
    <code>by</code> properties, where the <code>compare</code> is a
    comparator and <code>by</code> is a "mapping" function that accepts an
    element of the array and returns the property by which to sort it.
    The default comparator is <code>Object.compare</code>.
    @param {Function} by is a "mapping" function for each element of the array.
    The default mapping is <code>Function.identity</code>.
    @param {Number} order 1 for ascending, -1 for descending, 0 for waste of
    time.
    @returns a new array with the values from the original array in
    the specified sorted order.
*/
// TODO(kriskowal) consider an alternate implementation that pre-memoizes all
// of the corresponding "by" computations with a weak-map.  compare for memory
// usage and speed.
Object.defineProperty(Array.prototype, "sorted", {
    value: function (compare, by, order) {
        compare = compare || Object.compare;
        // account for comparators generated by Function.by
        if (compare.by) {
            by = compare.by;
            compare = compare.compare || Object.compare;
        } else {
            by = by || Function.identity;
        }
        if (order === undefined)
            order = 1;
        return this.map(function (item) {
            return {
                by: by(item),
                value: item
            };
        })
        .sort(function (a, b) {
            return compare(a.by, b.by) * order;
        })
        .map(function (pair) {
            return pair.value;
        });
    },
    writable: true,
    configurable: true
});

/**
    Creates a shallow copy of this array.

    @function external:Array#clone
    @returns {Object} a shallow copy of this array
*/
Object.defineProperty(Array.prototype, "clone", {
    value: function (depth, memo) {
        if (depth === undefined) {
            depth = Infinity;
        } else if (depth === 0) {
            return this;
        }
        return this.map(function (value) {
            return Object.clone(value, depth - 1, memo);
        });
    },
    writable: true,
    configurable: true
});

/**
    Removes all members of this array making the object suitable for reuse.
    Assumes that the array has no other named properties.

    @function external:Aray#wipe
*/
Object.defineProperty(Array.prototype, "wipe", {
    value: function() {
        this.length = 0;
        return this;
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

