/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>

 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines standardized shims for the intrinsic <code>Object</code>.
    @see [Object class]{@link external:Object}
    @module montage/core/shim/object
*/
/**
    @external Object
*/

/**
    Creates a new object that inherits prototypically directly from a given
    prototype, optionally defining some properties.
    @function external:Object.create
    @param {Object} prototype the prototype to inherit, or
    <code>null</code> for no prototype, which makes "__proto__" the only
    special property name.
    @param {Object} descriptor a property descriptor
    @returns a new object inheriting from the given prototype and having
    the given property descriptor.
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

// These are used in montage.js to ascertain whether we can annotate
// objects with montage metadata.

// TODO documentation
if (!Object.isSealed) {
    Object.defineProperty(Object, "isSealed", {
        value: function() {
            return false;
        },
        writable: true,
        configurable: true
    });
}

// TODO documentation
if (!Object.seal) {
    Object.defineProperty(Object, "seal", {
        value: function(object) {
            return object;
        },
        writable: true,
        configurable: true
    });
}

