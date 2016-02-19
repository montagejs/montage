
var Shim = require("collections/shim");
var GenericCollection = require("collections/generic-collection");
var GenericSet = require("collections/generic-set");
var PropertyChanges = require("collections/listen/property-changes");
var RangeChanges = require("collections/listen/range-changes");
var MapChanges = require("collections/listen/map-changes");

if(global.Set !== void 0) {
    var Set = module.exports = global.Set;

    // use different strategies for making sets observable between Internet
    // Explorer and other browsers.
    var protoIsSupported = {}.__proto__ === Object.prototype;
    var set_makeObservable;
    if (protoIsSupported) {
        set_makeObservable = function () {
            this.__proto__ = ChangeDispatchSet;
        };
    } else {
        set_makeObservable = function () {
            Object.defineProperties(this, observableSetProperties);
        };
    }

    Object.defineProperty(Set.prototype, "makeObservable", {
        value: set_makeObservable,
        writable: true,
        configurable: true,
        enumerable: false
    });

    function defineEach(prototype) {
        var proto = Set.prototype;
        for (var name in prototype) {
            if(!proto.hasOwnProperty(name)) {
                Object.defineProperty(Set.prototype, name, {
                    value: prototype[name],
                    writable: true,
                    configurable: true,
                    enumerable: false
                });
            }
        }
    }
    defineEach(PropertyChanges.prototype);
    //This is a no-op test in property-changes.js - PropertyChanges.prototype.makePropertyObservable, so might as well not pay the price every time....
    Object.defineProperty(Set.prototype, "makePropertyObservable", {
        value: function(){},
        writable: true,
        configurable: true,
        enumerable: false
    });
    defineEach(RangeChanges.prototype);
    defineEach(MapChanges.prototype);

    Set.prototype.reduce = function (callback, basis /*, thisp*/) {
        var thisp = arguments[2];
        this.forEach(function(value) {
            basis = callback.call(thisp, basis, value, this);
        });
        return basis;
    };

    Set.prototype.reduceRight = function (callback, basis /*, thisp*/) {
        var thisp = arguments[2];
        var setIterator = this.values();
        var size = this.size;
        var reverseOrder = new Array(this.size);
        var value, i = 0;
        while ((value = setIterator.next().value)) {
            reverseOrder[--size] = value;
        }
        while (i++ < size) {
            basis = callback.call(thisp, basis, value, this);
        }
        return basis;
    };

    Set.prototype.equals = function (that, equals) {
        var self = this
            thatLength = that.size || that.length;
        return (
            that && typeof that.reduce === "function" &&
            this.size === thatLength &&
            that.reduce(function (equal, value) {
                return equal && self.has(value, equals);
            }, true)
        );
    };

    Set.prototype.constructClone = function (values) {
        return new this.constructor(values, this.contentEquals, this.contentHash, this.getDefault);
    };


    var set_clear = Set.prototype.clear,
        set_add = Set.prototype.add,
        set_delete = Set.prototype.delete;

    var observableSetProperties = {
        "__dispatchValueArray": {
            value: void 0,
            writable: true,
            configurable: true
        },
        "_dispatchValueArray": {
            get: function() {
                return this.__dispatchValueArray || (this.__dispatchValueArray = []);
            }
        },
        "_dispatchEmptyArray": {
            value: []
        },
        clear : {
            value: function () {
                var clearing;
                if (this.dispatchesRangeChanges) {
                    clearing = this.toArray();
                    this.dispatchBeforeRangeChange(this._dispatchEmptyArray, clearing, 0);
                }

                set_clear.call(this);

                if (this.dispatchesRangeChanges) {
                    this.dispatchRangeChange(this._dispatchEmptyArray, clearing, 0);
                }
            },
            writable: true,
            configurable: true

        },
        add : {
            value: function (value) {
                if (!this.has(value)) {
                    this._dispatchValueArray[0] = value;
                    if (this.dispatchesRangeChanges) {
                        this.dispatchBeforeRangeChange(this._dispatchValueArray, this._dispatchEmptyArray, void 0);
                    }

                    set_add.call(this,value);

                    if (this.dispatchesRangeChanges) {
                        this.dispatchRangeChange(this._dispatchValueArray, this._dispatchEmptyArray, void 0);
                    }
                    return true;
                }
                return false;
            },
            writable: true,
            configurable: true
        },

        "delete": {
            value: function (value) {
                if (this.has(value)) {
                    this._dispatchValueArray[0] = value;
                    if (this.dispatchesRangeChanges) {
                        this.dispatchBeforeRangeChange(this._dispatchEmptyArray, this._dispatchValueArray);
                    }

                    set_delete.call(this,value);

                    if (this.dispatchesRangeChanges) {
                        this.dispatchRangeChange(this._dispatchEmptyArray, this._dispatchValueArray);
                    }
                    return true;
                }
                return false;
            }
        }
    };



    Object.addEach(Set.prototype, GenericCollection.prototype, false);
    Object.addEach(Set.prototype, GenericSet.prototype, false);
    // Object.addEach(Set.prototype, PropertyChanges.prototype, false);
    // Object.addEach(Set.prototype, RangeChanges.prototype, false);

    var ChangeDispatchSet = Object.create(Set.prototype, observableSetProperties);
    //exports.observableSetProperties = observableSetProperties;


} else {
    module.exports = require("collections/set");
}
