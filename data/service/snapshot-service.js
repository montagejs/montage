var Montage = require("core/core").Montage,
    Map = require("collections/map");

/**
 * @class SnapshotService
 * @extends Montage
 */
exports.SnapshotService = Montage.specialize(/** @lends SnapshotService# */ {

    constructor: {
        value: function SnapshotService() {
            this._cache = new Map();
        }
    },

    _cache: {
        value: null
    },

    saveSnapshotForTypeNameAndId: {
        value: function (snapshot, typeName, id) {
            if (!this._cache.has(typeName)) {
                this._cache.set(typeName, new Map());
            }

            this._cache.get(typeName).set(id, this._getClone(snapshot));
        }
    },

    getSnapshotForTypeNameAndId: {
        value: function (typeName, id) {
            var result;
            if (this._cache.has(typeName)) {
                result = this._cache.get(typeName).get(id);
            }
            return result;
        }
    },

    removeSnapshotForTypeNameAndId: {
        value: function (typeName, id) {
            if (this._cache.has(typeName)) {
                this._cache.get(typeName).delete(id);
            }
        }
    },

    getDifferenceWithSnapshotForTypeNameAndId: {
        value: function (rawData, typeName, id) {
            var difference = this._getClone(rawData),
                cachedVersion, cachedKeys, key;
            if (this._cache.has(typeName)) {
                cachedVersion = this._cache.get(typeName).get(id);
            }
            if (cachedVersion) {
                cachedKeys = Object.keys(cachedVersion);
                for (var i = 0, length = cachedKeys.length; i < length; i++) {
                    key = cachedKeys[i];
                    if (this._areSameValues(rawData[key], cachedVersion[key])) {
                        delete difference[key];
                    }
                }
            }
            return difference;
        }
    },

    _getClone: {
        value: function (object) {
            var result, keys, key;
            /*, temp, j, arrayLength, arrayKeys*/
            if (object) {
                result = Object.create(null);
                keys = Object.keys(object);
                for (var i = 0, length = keys.length; i < length; i++) {
                    key = keys[i];
                    if (Array.isArray(object[key])) {
                        result[key] = this._getArrayClone(object[key]);
                    } else if (typeof object[key] === "object") {
                        result[key] = this._getClone(object[key]);
                    } else {
                        result[key] = object[key];
                    }
                }
            } else {
                result = object;
            }
            return result;
        }
    },

    _getArrayClone: {
        value: function (array) {
            var result = [],
                value;
            for (var i = 0, length = array.length; i < length; i++) {
                value = array[i];
                if (Array.isArray(value)) {
                    result.push(this._getArrayClone(value));
                } else if (typeof value === "object") {
                    result.push(this._getClone(value));
                } else {
                    result.push(value);
                }
            }
            return result;
        }
    },

    _areSameValues: {
        value: function(a, b) {
            var result = a === b;
            if (!result) {
                if (typeof a === "object" && typeof b === "object" &&
                    a !== null && b !== null) {
                    var aKeys = Object.keys(a).sort(), aValue,
                        bKeys = Object.keys(b).sort(), bValue,
                        key;

                    var aResult = aKeys.filter(function(x) { return a[x] !== null; }).length,
                        bResult = bKeys.filter(function(x) { return b[x] !== null;  }).length;

                    result = aResult === bResult;

                    if (result) {
                        for (var i = 0, length = bKeys.length; i < length; i++) {
                            key = bKeys[i];
                            aValue = a[key];
                            bValue = b[key];
                            if (!this._areSameValues(aValue, bValue)) {
                                result = false;
                                break;
                            }
                        }
                    }
                }
            }
            return result;
        }
    },

    _equals: {
        value: function (a, b) {
            return  typeof a === "object" && a !== null &&
                    typeof b === "object" && b !== null ? this._compareObjects(a, b) : a === b;
        }
    },

    _compareObjects: {
        value: function (a, b) {
            var aKeys = this._sortedNonNullKeysForObject(a),
                bKeys = this._sortedNonNullKeysForObject(b),
                areEqual = aKeys.length === bKeys.length,
                i, length, key;

            for (i = 0, length = bKeys.length; i < length && areEqual; i += 1) {
                key = bKeys[i];
                areEqual = this._equals(a[key], b[key]);
            }
            return areEqual;
        }
    },

    _sortedNonNullKeysForObject: {
        value: function (object) {
            return Object.keys(object).sort().filter(function (key) {
                return object[key] !== null;
            });
        }
    }
});
