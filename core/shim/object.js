/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
    Defines standardized shims for the intrinsic <code>Object</code>.
    @see {external:Object}
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

