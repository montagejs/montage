"use strict";

var Shim = require("./shim");
var GenericCollection = require("./generic-collection");
var GenericSet = require("./generic-set");
var Set, GlobalSet, CollectionsSet;


if((global.Set !== void 0) && (typeof global.Set.prototype.values === "function")) {

    GlobalSet = module.exports = global.Set;
    GlobalSet.Set = GlobalSet; // hack so (require)("set").Set will work in MontageJS

    GlobalSet.prototype.reduce = function (callback, basis /*, thisp*/) {
        var thisp = arguments[2];
        this.forEach(function(value) {
            basis = callback.call(thisp, basis, value, this);
        });
        return basis;
    };

    GlobalSet.prototype.reduceRight = function (callback, basis /*, thisp*/) {
        var thisp = arguments[2];
        var setIterator = this.values();
        var size = this.size;
        var reverseOrder = new Array(this.size);
        var value, i = size;
        // Fill 'reverseOrder' with values of Set in inverted order.
        while ((value = setIterator.next().value)) {
            reverseOrder[--i] = value;
        }
        // Iterate over reversed values and callback.
        while (i < size) {
            basis = callback.call(thisp, basis, reverseOrder[i++], this);
        }
        return basis;
    };

    GlobalSet.prototype.equals = function (that, equals) {
        var self = this;
        return (
            that && typeof that.reduce === "function" &&
            this.size === (that.size || that.length) &&
            that.reduce(function (equal, value) {
                return equal && self.has(value, equals);
            }, true)
        );
    };

    GlobalSet.prototype.constructClone = function (values) {
        return new this.constructor(values, this.contentEquals, this.contentHash, this.getDefault);
    };

    GlobalSet.prototype.toJSON = function () {
        return this.entriesArray();
    };

    GlobalSet.prototype.one = function () {
        if (this.size > 0) {
            return this.values().next().value;
        }
        return undefined;
    };

    GlobalSet.prototype.pop = function () {
        if (this.size) {
            var setIterator = this.values(), aValue, value;
            while(aValue = setIterator.next().value) {
                value = aValue;
            }
            this["delete"](value,this.size-1);
            return value;
        }
    };

    GlobalSet.prototype.shift = function () {
        if (this.size) {
            var firstValue = this.values().next().value;
            this["delete"](firstValue,0);
            return firstValue;
        }
    };

    //Backward compatibility:
    Object.defineProperty(GlobalSet.prototype,"length",{
        get: function() {
            return this.size;
        },
        enumerable: true,
        configurable:true
    });

    GlobalSet.from = function (value) {
        var result = (new this);
        result.addEach(value);
        return result;
    };

    Object.addEach(GlobalSet.prototype, GenericCollection.prototype, false);
    Object.addEach(GlobalSet.prototype, GenericSet.prototype, false);

}


GlobalSet.prototype.valuesArray = GenericSet.prototype.valuesArray;
GlobalSet.prototype.entriesArray = GenericSet.prototype.entriesArray;
module.exports = GlobalSet;
