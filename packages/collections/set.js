"use strict";

var Shim = require("./shim");
var List = require("./list");
var FastSet = require("./fast-set");
var GenericCollection = require("./generic-collection");
var GenericSet = require("./generic-set");
var PropertyChanges = require("./listen/property-changes");
var RangeChanges = require("./listen/range-changes");

module.exports = Set;

function Set(values, equals, hash, content) {
    if (!(this instanceof Set)) {
        return new Set(values, equals, hash);
    }
    equals = equals || Object.equals;
    hash = hash || Object.hash;
    content = content || Function.noop;
    this.contentEquals = equals;
    this.contentHash = hash;
    this.content = content;
    // a list of values in insertion order, used for all operations that depend
    // on iterating in insertion order
    this.order = new this.Order(undefined, equals);
    // a set of nodes from the order list, indexed by the corresponding value,
    // used for all operations that need to quickly seek  value in the list
    this.store = new this.Store(
        undefined,
        function (a, b) {
            return equals(a.value, b.value);
        },
        function (node) {
            return hash(node.value);
        }
    );
    this.length = 0;
    this.addEach(values);
}

Object.addEach(Set.prototype, GenericCollection.prototype);
Object.addEach(Set.prototype, GenericSet.prototype);
Object.addEach(Set.prototype, PropertyChanges.prototype);
Object.addEach(Set.prototype, RangeChanges.prototype);

Set.prototype.Order = List;
Set.prototype.Store = FastSet;

Set.prototype.constructClone = function (values) {
    return new this.constructor(values, this.contentEquals, this.contentHash, this.content);
};

Set.prototype.has = function (value) {
    var node = new this.order.Node(value);
    return this.store.has(node);
};

Set.prototype.get = function (value) {
    var node = new this.order.Node(value);
    node = this.store.get(node);
    if (node) {
        return node.value;
    } else {
        return this.content(value);
    }
};

Set.prototype.add = function (value) {
    var node = new this.order.Node(value);
    if (!this.store.has(node)) {
        if (this.dispatchesRangeChanges) {
            this.dispatchBeforeRangeChange([value], [], 0);
        }
        this.order.add(value);
        node = this.order.head.prev;
        this.store.add(node);
        this.length++;
        if (this.dispatchesRangeChanges) {
            this.dispatchRangeChange([value], [], 0);
        }
        return true;
    }
    return false;
};

Set.prototype["delete"] = function (value) {
    var node = new this.order.Node(value);
    if (this.store.has(node)) {
        if (this.dispatchesRangeChanges) {
            this.dispatchBeforeRangeChange([], [value], 0);
        }
        var node = this.store.get(node);
        this.store["delete"](node); // removes from the set
        node["delete"](); // removes the node from the list in place
        this.length--;
        if (this.dispatchesRangeChanges) {
            this.dispatchRangeChange([], [value], 0);
        }
        return true;
    }
    return false;
};

Set.prototype.one = function () {
    if (this.length === 0) {
        throw new Error("Can't get one value from empty set.");
    }
    return this.store.one().value;
};

Set.prototype.clear = function () {
    this.store.clear();
    this.order.clear();
    this.length = 0;
};

Set.prototype.reduce = function (callback, basis /*, thisp*/) {
    var thisp = arguments[2];
    var list = this.order;
    return list.reduce(function (basis, value) {
        return callback.call(thisp, basis, value, value, this);
    }, basis, this);
};

Set.prototype.reduceRight = function (callback, basis /*, thisp*/) {
    var thisp = arguments[2];
    var list = this.order;
    return list.reduceRight(function (basis, value) {
        return callback.call(thisp, basis, value, value, this);
    }, basis, this);
};

Set.prototype.iterate = function () {
    return this.order.iterate();
};

Set.prototype.log = function () {
    var set = this.store;
    return set.log.apply(set, arguments);
};

