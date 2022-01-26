Set = require("core/collections/map");

/**
 * The CountedMap keeps a counter associated with object inserted into it. It keeps track of the number of times objects are inserted and objects are really removed when they've been removed the same number of times.
 *
 * @class CountedMap
 * @classdesc todo
 * @extends Map
 */
var CountedMap = exports.CountedMap = function CountedMap(iterable) {

    var inst = new Map(iterable);
    inst.__proto__ = CountedMap.prototype;
    inst._contentCount = new Map();
    return inst;

}

CountedMap.prototype = Object.create(Map.prototype);

CountedMap.prototype._set = Map.prototype.set;
CountedMap.prototype.set = function(key, value) {
    var currentCount = this._contentCount.get(key) || (this.has(key) ? 1 : 0);
    if(currentCount === 0) {
        this._set(key, value);
    }
    this._contentCount.set(key,++currentCount);
    return this;
    //console.log("CountedMap add: countFor "+value.identifier.primaryKey+" is ",currentCount);
}
CountedMap.prototype._delete = Map.prototype.delete;
CountedMap.prototype.delete = function(key) {
    var currentCount = this._contentCount.get(key) || (this.has(key) ? 1 : 0);
    if(currentCount) {
        this._contentCount.set(key,--currentCount);
        if(currentCount === 0) {
            if(!this.has(key)) {
                console.error("Attempt to delete object that is actually gone, mismatch in add/delete?");
            }
            this._contentCount.delete(key);
            this._delete(key);
            return true;
        }
    }
    return false;
    //console.log("CountedMap delete: countFor "+value.identifier.primaryKey+" is ",currentCount);
}

CountedMap.prototype._clear = Map.prototype.clear;
CountedMap.prototype.clear = function(value) {
    this._contentCount.clear();
    this._clear();
};


CountedMap.prototype.countFor = function(key) {
    return this._contentCount.get(key) || 0;
}
