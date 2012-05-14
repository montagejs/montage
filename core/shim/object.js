
/**
 @external Object
 */

if (!Object.create) {
    Object._creator = function _ObjectCreator() {
        this.__proto__ = _ObjectCreator.prototype;
    };
    Object.create = function(o, properties) {
        this._creator.prototype = o || Object.prototype;
        //Still needs to add properties....
        return new this._creator;
    };

    Object.getPrototypeOf = function(o) {
        return o.__proto__;
    };
}

if (!Object.isSealed) {
    Object.defineProperty(Object, "isSealed", {
        value: function() {
            return false;
        }
    });
}

if (!Object.seal) {
    Object.defineProperty(Object, "seal", {
        value: function(object) {
            return object;
        }
    });
}

