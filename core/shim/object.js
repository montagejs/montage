/**
 * Defines standardized shims for the intrinsic `Object`.
 * @see {external:Object}
 * @module montage/core/shim/object
 */

/**
 * @external Object
 */

/**
 * Creates a new object that inherits prototypically directly from a given
 * prototype, optionally defining some properties.
 * @function external:Object.create
 * @param {Object} prototype the prototype to inherit, or
 * `null` for no prototype, which makes "__proto__" the only
 * special property name.
 * @param {Object} descriptor a property descriptor
 * @returns a new object inheriting from the given prototype and having
 * the given property descriptor.
 */
if (!Object.create) {
    Object._creator = function _ObjectCreator() {
        this.__proto__ = _ObjectCreator.prototype;
    };
    Object.create = function (o, properties) {
        this._creator.prototype = o || Object.prototype;
        //Still needs to add properties....
        return new this._creator;
    };

    Object.getPrototypeOf = function (o) {
        return o.__proto__;
    };
}

// These are used in montage.js to ascertain whether we can annotate
// objects with montage metadata.

// TODO documentation
if (!Object.isSealed) {
    Object.defineProperty(Object, "isSealed", {
        value: function () {
            return false;
        },
        writable: true,
        configurable: true
    });
}

// TODO documentation
if (!Object.seal) {
    Object.defineProperty(Object, "seal", {
        value: function (object) {
            return object;
        },
        writable: true,
        configurable: true
    });
}

