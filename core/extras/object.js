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

var WeakMap = require("core/shim/weak-map").WeakMap;

// string table, for strings that might be constructed multiple times
// seems to reduce allocations in a version of Firefox I once heard tell
var MODIFY = "modify";
var STRING = "string";
var FUNCTION = "function";
var OBJECT = "object";
var NUMBER = "number";
var HAS = "has";
var GET = "get";
var UNDEFINED_GET = "undefinedGet";
var SET = "set";
var EQUALS = "equals";
var VALUE_OF = "valueOf";
var CLONE = "clone";
var COMPARE = "compare";

/**
    A utility object to avoid unnecessary allocations of an empty object
    <code>{}</code>.  This object is frozen so it is safe to share.

    @function external:Object.empty
*/
Object.defineProperty(Object, "empty", {
    value: Object.freeze(Object.create(null)),
    writable: true,
    configurable: true
});

/**
    Returns whether the given value is an object, as opposed to a value.
    Unboxed numbers, strings, true, false, undefined, and null are not
    objects.  Arrays are objects.

    @function external:Object.isObject
    @param {Any} value
    @returns {Boolean} whether the given value is an object
*/
Object.defineProperty(Object, "isObject", {
    value: function (object) {
        return Object(object) === object;
    },
    writable: true,
    configurable: true
});

/**
    Returns the value of an any value, particularly objects that
    implement <code>valueOf</code>.

    <p>Note that, unlike the precedent of methods like
    <code>Object.equals</code> and <code>Object.compare</code> would suggest,
    this method is named <code>Object.getValueOf</code> instead of
    <code>valueOf</code>.  This is a delicate issue, but the basis of this
    decision is that the JavaScript runtime would be far more likely to
    accidentally call this method with no arguments, assuming that it would
    return the value of <code>Object</code> itself in various situations,
    whereas <code>Object.equals(Object, null)</code> protects against this case
    by noting that <code>Object</code> owns the <code>equals</code> property
    and therefore does not delegate to it.

    @function external:Object.getValueOf
    @param {Any} value a value or object wrapping a value
    @returns {Any} the primitive value of that object, if one exists, or passes
    the value through
*/
Object.defineProperty(Object, "getValueOf", {
    value: function (value) {
        if (Object.implements(value, VALUE_OF)) {
            value = value.valueOf();
        }
        return value;
    },
    writable: true,
    configurable: true
});

/**
    A shorthand for <code>Object.prototype.hasOwnProperty.call(object,
    key)</code>.  Returns whether the object owns a property for the given key.
    It does not consult the prototype chain and works for any string (including
    "hasOwnProperty") except "__proto__".

    @function external:Object.owns
    @param {Object} object
    @param {String} key
    @returns {Boolean} whether the object owns a property wfor the given key.
*/
var owns = Object.prototype.hasOwnProperty;
Object.defineProperty(Object, "owns", {
    value: function (object, key) {
        return owns.call(object, key);
    },
    writable: true,
    configurable: true
});

/**
    Returns whether a value implements a particular duck-type method.

    <p>To qualify as a duck-type method, the value in question must have a
    method by the given name on the prototype chain.  To distinguish it from
    a property of an object literal, the property must not be owned by the
    object directly.

    <p>A value that implements a method is not necessarily an object, for
    example, numbers implement <code>valueOf</code>, so this is function
    does not imply <code>Object.isObject</code> of the same value.

    @function external:Object.implements
    @param {Any} value a value
    @param {String} name a method name
    @returns {Boolean} whether the given value implements the given method

*/
Object.defineProperty(Object, "implements", {
    value: function (object, name) {
        return (
            object != null && // false only for null *and* undefined
            typeof object[name] === FUNCTION &&
            !owns.call(object, name)
        );
    },
    writable: true,
    configurable: true
});

/**
    A utility that is like Object.owns but is also useful for finding
    properties on the prototype chain, provided that they do not refer to
    methods on the Object prototype.  Works for all strings except "__proto__".

    <p>Alternately, you could use the "in" operator as long as the object
    descends from "null" instead of the Object.prototype, as with
    <code>Object.create(null)</code>.  However,
    <code>Object.create(null)</code> only works in fully compliant EcmaScript 5
    JavaScript engines and cannot be faithfully shimmed.

    <p>If the given object is an instance of a type that implements a method
    named "has", this function defers to the collection, so this method can be
    used to generically handle objects, arrays, or other collections.  In that
    case, the domain of the key depends on the instance.

    @param {Object} object
    @param {String} key
    @returns {Boolean} whether the object, or any of its prototypes except
    <code>Object.prototype</code>
    @function external:Object.has
*/
Object.defineProperty(Object, "has", {
    value: function (object, key) {
        if (typeof object !== "object") {
            throw new Error("Object.has can't accept non-object: " + typeof object);
        }
        // forward to mapped collections that implement "has"
        if (Object.implements(object, HAS)) {
            return object.has(key);
        // otherwise report whether the key is on the prototype chain,
        // as long as it is not one of the methods on object.prototype
        } else if (typeof key === STRING) {
            return key in object && object[key] !== Object.prototype[key];
        } else {
            throw new Error("Key must be a string for Object.has on plain objects");
        }
    },
    writable: true,
    configurable: true
});

/**
    Gets the value for a corresponding key from an object.

    <p>Uses Object.has to determine whether there is a corresponding value for
    the given key.  As such, <code>Object.get</code> is capable of retriving
    values from the prototype chain as long as they are not from the
    <code>Object.prototype</code>.

    <p>If there is no corresponding value and the given default value is not
    <code>undefined</code>, returns the given default value.  Otherwise, if the
    object implements <code>undefinedGet</code>, delegates to that method.
    Otherwise returns <code>undefined</code>.

    <p>If the given object is an instance of a type that implements a method
    named "get", this function defers to the collection, so this method can be
    used to generically handle objects, arrays, or other collections.  In that
    case, the domain of the key depends on the implementation.  For a `Map`,
    for example, the key might be any object.

    @param {Object} object
    @param {String} key
    @param {Any} value a default to return, <code>undefined</code> if omitted
    @returns {Any} value for key, or default value
    @function external:Object.get
*/
Object.defineProperty(Object, "get", {
    value: function (object, key, value) {
        if (typeof object !== "object") {
            throw new Error("Object.get can't accept non-object: " + typeof object);
        }
        // forward to mapped collections that implement "get"
        if (Object.implements(object, GET)) {
            return object.get(key, value);
        } else if (Object.has(object, key)) {
            return object[key];
        } else if (value !== undefined) {
            return value;
        } else if (Object.implements(object, UNDEFINED_GET)) {
            return object.undefinedGet();
        }
    },
    writable: true,
    configurable: true
});

/**
    Sets the value for a given key on an object.

    <p>If the given object is an instance of a type that implements a method
    named "set", this function defers to the collection, so this method can be
    used to generically handle objects, arrays, or other collections.  As such,
    the key domain varies by the object type.

    @param {Object} object
    @param {String} key
    @param {Any} value
    @returns <code>undefined</code>
    @function external:Object.set
*/
Object.defineProperty(Object, "set", {
    value: function (object, key, value) {
        if (Object.implements(object, SET)) {
            object.set(key, value);
        } else {
            object[key] = value;
        }
    },
    writable: true,
    configurable: true
});

/**
    Iterates over the owned properties of an object.

    @function external:Object.forEach
    @param {Object} object an object to iterate.
    @param {Function} callback a function to call for every key and value
    pair in the object.  Receives <code>value</code>, <code>key</code>,
    and <code>object</code> as arguments.
    @param {Object} thisp the <code>this</code> to pass through to the
    callback
*/
Object.defineProperty(Object, "forEach", {
    value: function (object, callback, thisp) {
        Object.keys(object).forEach(function (key) {
            callback.call(thisp, object[key], key, object);
        });
    },
    writable: true,
    configurable: true
});

/**
    Iterates over the owned properties of a map, constructing a new array of
    mapped values.

    @function external:Object.map
    @param {Object} object an object to iterate.
    @param {Function} callback a function to call for every key and value
    pair in the object.  Receives <code>value</code>, <code>key</code>,
    and <code>object</code> as arguments.
    @param {Object} thisp the <code>this</code> to pass through to the
    callback
    @returns {Array} the respective values returned by the callback for each
    item in the object.
*/
Object.defineProperty(Object, "map", {
    value: function (object, callback, thisp) {
        return Object.keys(object).map(function (key) {
            return callback.call(thisp, object[key], key, object);
        });
    },
    writable: true,
    configurable: true
});

/**
    Returns the values for owned properties of an object.

    @function external:Object.map
    @param {Object} object
    @returns {Array} the respective value for each owned property of the
    object.
*/
Object.defineProperty(Object, "values", {
    value: function (object) {
        return Object.map(object, Function.identity)
    },
    writable: true,
    configurable: true
});

/**
    Returns whether two values are identical.  Any value is identical to itself
    and only itself.  This is much more restictive than equivalence and subtly
    different than strict equality, <code>===</code> because of edge cases
    including negative zero and <code>NaN</code>.  Identity is useful for
    resolving collisions among keys in a mapping where the domain is any value.
    This method does not delgate to any method on an object and cannot be
    overridden.
    @see http://wiki.ecmascript.org/doku.php?id=harmony:egal
    @param {Any} this
    @param {Any} that
    @returns {Boolean} whether this and that are identical
    @function external:Object.is
*/
Object.defineProperty(Object, "is", {
    value: function(x, y) {
        if (x === y) {
            // 0 === -0, but they are not identical
            return x !== 0 || 1 / x === 1 / y;
        }
        // NaN !== NaN, but they are identical.
        // NaNs are the only non-reflexive value, i.e., if x !== x,
        // then x is a NaN.
        // isNaN is broken: it converts its argument to number, so
        // isNaN("foo") => true
        return x !== x && y !== y;
    },
    writable: true,
    configurable: true
});

/**
    Performs a polymorphic, type-sensitive deep equivalence comparison of any
    two values.

    <p>As a basic principle, any value is equivalent to itself (as in
    identity), any boxed version of itself (as a <code>new Number(10)</code> is
    to 10), and any deep clone of itself.

    <p>Equivalence has the following properties:

    <ul>
        <li><strong>polymorphic:</strong>
            If the given object is an instance of a type that implements a
            methods named "equals", this function defers to the method.  So,
            this function can safely compare any values regardless of type,
            including undefined, null, numbers, strings, any pair of objects
            where either implements "equals", or object literals that may even
            contain an "equals" key.
        <li><strong>type-sensitive:</strong>
            Incomparable types are not equal.  No object is equivalent to any
            array.  No string is equal to any other number.
        <li><strong>deep:</strong>
            Collections with equivalent content are equivalent, recursively.
        <li><strong>equivalence:</strong>
            Identical values and objects are equivalent, but so are collections
            that contain equivalent content.  Whether order is important varies
            by type.  For Arrays and lists, order is important.  For Objects,
            maps, and sets, order is not important.  Boxed objects are mutally
            equivalent with their unboxed values, by virtue of the standard
            <code>valueOf</code> method.
    </ul>
    @param this
    @param that
    @returns {Boolean} whether the values are deeply equivalent
    @function external:Object.equals
*/
Object.defineProperty(Object, "equals", {
    value: function (a, b) {
        // unbox objects, but do not confuse object literals
        a = Object.getValueOf(a);
        b = Object.getValueOf(b);
        if (a === b)
            return true;
        if (Object.implements(a, EQUALS))
            return a.equals(b);
        // commutative
        if (Object.implements(b, EQUALS))
            return b.equals(a);
        if (typeof a === OBJECT && typeof b === OBJECT) {
            if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
                return false;
            } else {
                var aKeys = Object.keys(a);
                var bKeys = Object.keys(b);
                return (
                    aKeys.equals(bKeys) &&
                    aKeys.every(function (key) {
                        return Object.equals(a[key], b[key]);
                    })
                );
            }
        }
        return false;
    },
    writable: true,
    configurable: true
});

// Because a return value of 0 from a `compare` function  may mean either
// "equals" or "is incomparable", `equals` cannot be defined in terms of
// `compare`.  However, `compare` *can* be defined in terms of `equals` and
// `lessThan`.  Again however, more often it would be desirable to implement
// all of the comparison functions in terms of compare rather than the other
// way around.

/**
    Determines the order in which any two objects should be sorted by returning
    a number that has an analogous relationship to zero as the left value to
    the right.  That is, if the left is "less than" the right, the returned
    value will be "less than" zero, where "less than" may be any other
    transitive relationship.

    <p>Arrays are compared by the first diverging values, or by length.

    <p>Any two values that are incomparable return zero.  As such,
    <code>equals</code> should not be implemented with <code>compare</code>
    since incomparability is indistinguishable from equality.

    <p>Sorts strings lexicographically.  This is not suitable for any
    particular international setting.  Different locales sort their phone books
    in very different ways, particularly regarding diacritics and ligatures.

    <p>If the given object is an instance of a type that implements a method
    named "compare", this function defers to the instance.  The method does not
    need to be an owned property to distinguish it from an object literal since
    object literals are incomparable.  Unlike <code>Object</code> however,
    <code>Array</code> implements <code>compare</code>.

    @param {Any} left
    @param {Any} right
    @returns {Number} a value having the same transitive relationship to zero
    as the left and right values.
    @function external:Object.compare
*/
Object.defineProperty(Object, "compare", {
    value: function (a, b) {
        // unbox objects, but do not confuse object literals
        // mercifully handles the Date case
        a = Object.getValueOf(a);
        b = Object.getValueOf(b);
        if (a === b)
            return 0;
        if (typeof a === NUMBER && typeof b === NUMBER)
            return a - b;
        if (typeof a === STRING)
            return a < b ? -1 : 1;
            // the possibility of equality elimiated above
        if (Object.implements(a, COMPARE))
            return a.compare(b);
        // not commutative, the relationship is reversed
        if (Object.implements(b, COMPARE))
            return -b.compare(a);
        return 0;
    },
    writable: true,
    configurable: true
});

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

/**
    Creates a deep copy of any value.  Values, being immutable, are
    returned without alternation.  Forwards to <code>clone</code> on
    objects and arrays.

    @function external:Object.clone
    @param {Any} value a value to clone
    @param {Number} depth an optional traversal depth, defaults to infinity.
    A value of <code>0</code> means to make no clone and return the value
    directly.
    @param {WeakMap} memo an optional memo of already visited objects to
    preserve reference cycles.  The cloned object will have the exact same
    shape as the original, but no identical objects.  If passed explicitly, the
    weak map may be later used to associate all objects in the original object
    graph with their corresponding member of the cloned graph.
    @returns a copy of the value
*/
Object.defineProperty(Object, "clone", {
    value: function (value, depth, memo) {
        value = Object.getValueOf(value);
        if (depth === undefined) {
            depth = Infinity;
        } else if (depth === 0) {
            return value;
        }
        if (Object.isObject(value) && Object.implements(value, CLONE)) {
            memo = memo || new WeakMap();
            if (!memo.has(value)) {
                memo.set(value, value.clone(depth, memo));
            }
            return memo.get(value);
        } else {
            return value;
        }
    },
    writable: true,
    configurable: true
});

/**
    Creates a copy of this object with all the same owned
    properties and prototype.

    @function external:Object#clone
    @param {Number} depth an optional traversal depth, defaults to infinity
    @param {WeakMap} memo an optional memo of already visited objects to break
    reference cycles
    @returns {Object} a copy of this object with the same owned properties
    and prototype.
*/
Object.defineProperty(Object.prototype, "clone", {
    value: function (depth, memo) {
        if (depth === undefined) {
            depth = Infinity;
        }
        memo = memo || new WeakMap();
        if (depth === 0) {
            return this;
        }
        if (memo.has(this)) {
            return memo.get(this);
        }
        var clone = Object.create(Object.getPrototypeOf(this));
        memo.set(this, clone);
        Object.forEach(this, function (value, key) {
            clone[key] = Object.clone(value, depth - 1, memo);
        });
        return clone;
    },
    writable: true,
    configurable: true
});

/**
    Removes all properties owned by this object making the object suitable for
    reuse.

    @function external:Object#wipe
    @returns this
*/
Object.defineProperty(Object.prototype, "wipe", {
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

