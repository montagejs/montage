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

/**
 * Assigns all properties from source objects onto the target object.
 * @function external:Object.assign
 * @param {Object} target The object to assign values onto. Must be
 * truthy.
 * @param {...Object} sources Objects whose properties should be
 * assigned onto the target. If none are given, the function call
 * is a no-op.
 * @return {Object} the target object
 */
if (!Object.assign) {
    Object.defineProperty(Object, "assign", {
        value: function (target, sources) {
            var source,
                s, ss,
                keys,
                k, kk;
            if (target === void 0 || target === null) {
                throw new TypeError("Cannot convert undefined or null to object");
            }
            for (s = 1, ss = arguments.length; s < ss; ++s) {
                source = arguments[s];
                if (source) {
                    keys = Object.keys(source);
                    for (k = 0, kk = keys.length; k < kk; ++k) {
                        target[keys[k]] = source[keys[k]];
                    }
                }
            }
            return target;
        },
        writable: true,
        enumerable: false,
        configurable: true
    });
}
