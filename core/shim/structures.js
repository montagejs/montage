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

// Specification:
// http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets

/**
    This module provides common data structure utililties, such as maps and sets.
    @module montage/core/shim/structures
    @see [Map class]{@link module:montage/core/shim/structures.Map}
*/

/**
    @class module:montage/core/shim/structures.Map
    @classdesc Provides a Map data structure for managing key/value pairs, including methods for querying and manipulating map elements. A map cannot contain duplicate keys; each key can map to at most one value.
*/
exports.Map = Map;
function Map(reserved, options) {
    if (!(this instanceof Map)) {
        return new Map(reserved, options);
    }
    options = options || {};
    var eq = options.eq || Set.eq;
    var hash = options.hash || Set.hash;
    this._set = Set(
        undefined,
        {
            eq: function (a, b) {
                return eq(a.key, b.key);
            },
            hash: function (pair) {
                return hash(pair.key);
            }
        }
    );
}

Object.defineProperties(Map.prototype, /** @lends module:montage/core/shim/structures.Map# */ {
    /**
        @function
        @returns this._set.empty()
    */
    empty: {
        value: function () {
            return this._set.empty();
        }
    },

    /**
     Returns the value associated with the <code>key</code> parameter, if it exists.
     @function
     @param {String} key The name of the key.
     @returns {Object} The value of the specified key, if it exists; otherwise returns undefined.
     */
    get: {
        value: function (key) {
            var pair = this._set.get({
                key: key
            });
            return pair ? pair.value : undefined;
        }
    },

    /**
     Adds a new key/value pair to the map.
     @function
     @param {Object} key The key to use for the new pair.
     @param {Object} value The value to associate with the key.
     @returns key, value
     */
    set: {
        value: function (key, value) {
            return this._set.add({
                key: key,
                value: value
            });
        }
    },

    /**
     Deletes the element from the map specified by the <code>key</code> parameter.
     @function
     @param {Object} key The key of the map element to remove.
     @returns key
     */

    "delete": { // née del
        value: function (key) {
            return this._set["delete"]({
                key: key
            });
        }
    },

    /**
     Returns true if the map contains an element with the specified key, otherwise returns false.
     @function
     @param {Object} key The key of the element you want to query for.
     @returns {Boolean} Returns <code>true</code> if the map contains the specified key, otherwise returns <code>false</code>.
     */
    has: {
        value: function (key) {
            return this._set.has({
                key: key
            });
        }
    },

    /**
     Executes a function once per map element, passing the current element to each function as a parameter.
     @function
     @param {Function} callback The function to execute for each element.
     */

    forEach: {
        value: function (callback /*, thisp*/) {
            var self = Object(this),
                thisp = arguments[1];
            return this._set.forEach(function (pair) {
                callback.call(thisp, pair.value, pair.key, self);
            });
        }
    }
});

/**
 Provides a set data structure and methods to query and modify the set.<br>
 A set is a collection that contains no duplicate elements. It stores<br>
 @class module:montage/core/shim/structures.Set
 */
exports.Set = Set;
function Set(reserved, options) {
    if (!(this instanceof Set)) {
        return new Set(reserved, options);
    }
    options = options || {};
    var eq = options.eq || Set.eq;
    var hash = options.hash || Set.hash;
    this._buckets = {};
    this._Bucket = function () {
        return OrderedSet(undefined, {
            eq: eq
        });
    };
    this._eq = eq;
    this._hash = hash;
}

Object.defineProperties(Set.prototype, /** @lends module:montage/core/shim/structures.Set# */ {
    /**
     Determines if the set is empty or not.
     @function
     @returns {Boolean} Returns <code>true</code> if the set is empty, otherwise returns <code>false</code>.
     */
    empty: {
        value: function () {
            return !Object.keys(this._buckets).length;
        }
    },

    /**
     Retrieves the value of the specified set element.
     @function
     @param {Object} value The key to an element in the set.
     */
    get: {
        value: function (value) {
            var hash = this._hash(value);
            var buckets = this._buckets;
            return buckets[hash] ? buckets[hash].get(value) : undefined;
        }
    },

    /**
     Determines if the set contains a specified item.
     @function
     @param {Number} value
     @returns {Object} The value of the set element.
     */
    has: {
        value: function (value) {
            var hash = this._hash(value);
            var buckets = this._buckets;
            return buckets[hash] ? buckets[hash].has(value) : false;
        }
    },

    /**
     Inserts a new element into the set with <code>value</code> as the hash key.
     @function
     @param {String} value The new element's hash key.
     */
    add: { // née insert
        value: function (value) {
            var hash = this._hash(value);
            var buckets = this._buckets;
            var bucket = buckets[hash] = buckets[hash] || this._Bucket();
            bucket.add(value);
        }
    },

    /**
     Removes an element from the set identified by the specified hash key.
     @function
     @param {String} value The hash key of the element to remove.
     */
    "delete": { // née remove
        value: function (value) {
            var hash = this._hash(value);
            var buckets = this._buckets;
            var bucket = buckets[hash] = buckets[hash] || this._Bucket();
            bucket["delete"](value);
            if (bucket.empty()) {
                delete buckets[hash];
            }
        }
    },

    /**
     Executes a function once per set element.
     @function
     @param {Function} callback The function to execute on each element.
     @returns {Object} object
     */

    forEach: {
        value: function (callback /*, thisp*/) {
            var self = Object(this);
            var thisp = arguments[1];
            var buckets = self._buckets;
            return Object.keys(buckets).forEach(function (hash) {
                buckets[hash].forEach(callback, thisp);
            });
        }
    }
});
/**
    @class module:montage/core/shim/structures.OrderedSet
    @param {boolean} reserved
    @param {object} options
*/
exports.OrderedSet = OrderedSet;
function OrderedSet(reserved, options) {
    if (!(this instanceof OrderedSet)) {
        return new OrderedSet(reserved, options);
    }
    options = options || {};
    var eq = options.eq || OrderedSet.eq;
    var head = {};
    head.next = head;
    head.prev = head;
    this._head = head;
    this._eq = eq;
}
;
/**
  @private
*/
Object.defineProperties(OrderedSet.prototype, /** @lends module:montage/core/shim/structures.OrderedSet */{
    _delete: {
        value: function (node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
        }
    },

    _add: {
        value: function (node) {
            var head = this._head;
            var prev = head.prev;
            head.prev = node;
            node.prev = prev;
            prev.next = node;
            node.next = head;
        }
    },

    _find: {
        value: function (value) {
            var head = this._head;
            var at = head.next;
            while (at !== head) {
                if (this._eq(at.data, value)) {
                    return at;
                }
                at = at.next;
            }
        }
    },

    /**
    @function
    @returns {boolean} Returns <code>true</code> if empty, otherwise returns <code>false</code>
    */
    empty: {
        value: function () {
            var head = this._head;
            return head.next === head;
        }
    },
    /**
    @function
    @param {Number} value
    @returns !!this._find(value)
    */
    has: {
        value: function (value) {
            return !!this._find(value);
        }
    },
    /**
    @function
    @param {Number} value
    @returns found.data
    */
    get: {
        value: function (value) {
            var found = this._find(value);
            if (found) {
                return found.data;
            }
        }
    },
   /**
    @function
    @param {Number} value
    */
    add: { // née insert
        value: function (value) {
            if (!this._find(value)) {
                this._add({
                    data: value
                });
            }
        }
    },
  /**
    @function
    @param {Number} value
    */
    "delete": { // née remove
        value: function (value) {
            var found = this._find(value);
            if (found) {
                this._delete(found);
            }
        }
    },
   /**
    @function
    @param {Function} callback The callback function.
    @param {String} context The context string.
    */
    forEach: {
        value: function (callback, context) {
            var head = this._head;
            var at = head.next;
            while (at !== head) {
                callback.call(context, at.data);
                at = at.next;
            }
        }
    }
});

Set.eq =
    OrderedSet.eq = function (a, b) {
        return a === b;
    };

/**
    @function
    @param {String} value
    @returns "~"
    */
Set.hash = function (value) {
    return "~" + (
        value && typeof value.hash === "function" ?
            value.hash() :
            value
        );
};

// A least-recently-used cache map contains an entagled
// linked list and mapping.  The mapping serves to provide
// constant-time access to any of the linked list nodes.
// When nodes are accessed, they float to the top of the
// list. The least recently accessed node will be collected
// when the collection size exceeds the maximum length.
//
// A WeakMap is almost always a superior alternative to
// a CacheMap, but a CacheMap will suffice in some cases
// if the former is not available.

/**
    @exports CacheMap
    @function
    @param {Boolean} reserved
    @param {String} options
    @returns new CacheMap(reserved, options)
*/
exports.CacheMap = CacheMap;
function CacheMap(reserved, options) {
    if (!(this instanceof CacheMap)) {
        return new CacheMap(reserved, options);
    }
    options = options || {};

    this._set = new OrderedSet(undefined, options);
    this._map = new Map(undefined, options);

    this._length = 0;
    this._maxLength = options.maxLength || Infinity;
    this._ondrop = options.ondrop;
}

/**
    @class module:montage/core/shim/structures.CacheMap
*/
CacheMap.prototype = Object.create(Object.prototype,/** @lends module:montage/core/shim/structures.CacheMap# */ {
    /**
            @type {Constructor}
        @default CacheMap
    */
    constructor: {
        value: CacheMap
    },
/**
  @private
*/
    _add: {
        value: function (node) {
            this._map.set(node.key, node);
            this._set.add(node);
            this._length++;
            if (this._length > this._maxLength) {
                // delete least recently accessed node
                // /!\ dives deep into set structure
                var node = this._set._head.next;
                if (this._ondrop) {
                    this._ondrop(node.data);
                }
                this._set._delete(node);
                this._map["delete"](node.key);
                this._length--;
            }
        }
    },
 /**
  @private
*/
    _delete: {
        value: function (node) {
            this._map["delete"](node.key);
            this._set["delete"](node);
            this._length--;
        }
    },
 /**
    @function
    @returns this._set.empty()
    */
    empty: {
        value: function () {
            return this._set.empty();
        }
    },
   /**
    @function
    @param {Function} key
    @returns node.value
    */
    get: {
        value: function (key) {
            var node = this._map.get(key);
            if (!node) {
                return;
            }
            // push node to tail
            this._set["delete"](node);
            this._set.add(node);
            return node.value;
        }
    },
    /**
    @function
    @param {String} key
    @param {Number} value
    */
    set: {
        value: function (key, value) {
            var node = this._map.get(key);
            if (node) {
                node.value = value;
                this._delete(node);
            } else {
                node = {
                    key: key,
                    value: value
                };
            }
            this._add(node);
        }
    },
    /**
    @function
    @param {String} key
    */
    "delete": {
        value: function (key) {
            var node = this._map.get(key);
            if (node) {
                this._delete(node);
            }
        }
    },
    /**
    @function
    @param {String} key
    @returns this._map.has(key)
    */
    has: {
        value: function (key) {
            return this._map.has(key);
        }
    },
   /**
    @function
    @returns {Array} keys
    */
    keys: {
        value: function () {
            var keys = [];
            this._set.forEach(function (node) {
                keys.push(node.key);
            });
            return keys;
        }
    },
    /**
    @function
    @returns this._set.forEach.apply(this._set, arguments)
    */
    forEach: {
        value: function () {
            return this._set.forEach.apply(this._set, arguments);
        }
    }
});

