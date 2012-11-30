"use strict";

var Shim = require("./shim");
var Set = require("./set");
var GenericCollection = require("./generic-collection");
var GenericMap = require("./generic-map");
var PropertyChanges = require("./listen/property-changes");

module.exports = Map;

function Map(values, equals, hash, content) {
    if (!(this instanceof Map)) {
        return new Map(values, equals, hash);
    }
    equals = equals || Object.equals;
    hash = hash || Object.hash;
    content = content || Function.noop;
    this.contentEquals = equals;
    this.contentHash = hash;
    this.content = content;
    this.store = new Set(
        undefined,
        function keysEqual(a, b) {
            return equals(a.key, b.key);
        },
        function keyHash(item) {
            return hash(item.key);
        }
    );
    this.length = 0;
    this.addEach(values);
}

Object.addEach(Map.prototype, GenericCollection.prototype);
Object.addEach(Map.prototype, GenericMap.prototype); // overrides GenericCollection
Object.addEach(Map.prototype, PropertyChanges.prototype);

Map.prototype.constructClone = function (values) {
    return new this.constructor(
        values,
        this.contentEquals,
        this.contentHash,
        this.content
    );
};

Map.prototype.log = function (charmap, stringify) {
    stringify = stringify || this.stringify;
    this.store.log(charmap, stringify);
};

Map.prototype.stringify = function (item, leader) {
    return leader + JSON.stringify(item.key) + ": " + JSON.stringify(item.value);
}

