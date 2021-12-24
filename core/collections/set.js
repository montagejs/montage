"use strict";

var Set = require("./_set");
var PropertyChanges = require("./listen/property-changes");
var RangeChanges = require("./listen/range-changes");
var MapChanges = require("./listen/map-changes");
var GlobalSet;
var SIZE = "size";


if( (global.Set !== void 0) && (typeof global.Set.prototype.values === "function")) {
    GlobalSet = global.Set;
    module.exports = Set

    // use different strategies for making sets observable between Internet
    // Explorer and other browsers.
    var protoIsSupported = {}.__proto__ === Object.prototype,
        set_makeObservable;

    if (protoIsSupported) {
        set_makeObservable = function () {
            this.__proto__ = ChangeDispatchSet;
        };
    } else {
        set_makeObservable = function () {
            Object.defineProperties(this, observableSetProperties);
        };
    }

    Object.defineProperty(GlobalSet.prototype, "makeObservable", {
        value: set_makeObservable,
        writable: true,
        configurable: true,
        enumerable: false
    });

    var set_clear = GlobalSet.prototype.clear,
        set_add = GlobalSet.prototype.add,
        set_delete = GlobalSet.prototype.delete;

    var observableSetProperties = {
        "_dispatchEmptyArray": {
            value: []
        },
        "clear": {
            value: function () {
                var size = this.size,
                    clearing;
                if (size) {
                    this.dispatchBeforeOwnPropertyChange(SIZE, size);
                }
                if (this.dispatchesRangeChanges) {
                    clearing = this.toArray();
                    this.dispatchBeforeRangeChange(this._dispatchEmptyArray, clearing, 0);

                }

                set_clear.call(this);

                if (this.dispatchesRangeChanges) {
                    this.dispatchRangeChange(this._dispatchEmptyArray, clearing, 0);
                }
                if (size) {
                    this.dispatchOwnPropertyChange(SIZE, 0);
                }
            },
            writable: true,
            configurable: true

        },
        "add": {
            value: function (value) {
                if (!this.has(value)) {
                    var index = this.size;
                    var dispatchValueArray = [value];
                    this.dispatchBeforeOwnPropertyChange(SIZE, index);
                    if (this.dispatchesRangeChanges) {
                        this.dispatchBeforeRangeChange(dispatchValueArray, this._dispatchEmptyArray, index);
                    }

                    set_add.call(this,value);

                    if (this.dispatchesRangeChanges) {
                        this.dispatchRangeChange(dispatchValueArray, this._dispatchEmptyArray, index);
                    }
                    this.dispatchOwnPropertyChange(SIZE, index + 1);
                    return true;
                }
                return false;
            },
            writable: true,
            configurable: true
        },

        "delete": {
            value: function (value,index) {
                if (this.has(value)) {
                    var size = this.size;
                    if(index === undefined) {
                        var setIterator = this.values();
                        index = 0
                        while(setIterator.next().value !== value) {
                            index++;
                        }
                    }
                    this.dispatchBeforeOwnPropertyChange(SIZE, size);
                    var dispatchValueArray = [value];
                    if (this.dispatchesRangeChanges) {
                        this.dispatchBeforeRangeChange(this._dispatchEmptyArray, dispatchValueArray, index);
                    }

                    set_delete.call(this, value);

                    if (this.dispatchesRangeChanges) {
                        this.dispatchRangeChange(this._dispatchEmptyArray, dispatchValueArray, index);
                    }
                    this.dispatchOwnPropertyChange(SIZE, size - 1);
                    return true;
                }
                return false;
            }
        }
    };

    var ChangeDispatchSet = Object.create(GlobalSet.prototype, observableSetProperties);


    Object.defineEach(Set.prototype, PropertyChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);
    //This is a no-op test in property-changes.js - PropertyChanges.prototype.makePropertyObservable, so might as well not pay the price every time....
    Object.defineProperty(Set.prototype, "makePropertyObservable", {
        value: function(){},
        writable: true,
        configurable: true,
        enumerable: false
    });

    Object.defineEach(Set.prototype, RangeChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);
    Object.defineEach(Set.prototype, MapChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);

    //This is really only for testing
    // Object.defineProperty(Set, "_setupCollectionSet", {
    //     value: setupCollectionSet,
    //     writable: true,
    //     configurable: true,
    //     enumerable: false
    // });

}




