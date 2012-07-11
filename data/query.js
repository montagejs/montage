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
 @module montage/data/query
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var logger = require("core/logger").logger("query");
/**
 @class module:montage/data/query.Query
 */
var Query = exports.Query = Montage.create(Montage, /** @lends module:montage/data/query.Query# */ {
    /**
     Description TODO
     @type {Property}
     @default {Function} null
     */
    blueprint: {
        value: null,
        serializable: true
    },

    /**
     Description TODO
     @type {Property}
     @default {Selector} null
     */
    selector: {
        value: null,
        serializable: true
    },

    /**
     Description TODO
     @type {Property}
     @default {String} ""
     */
    name: {
        serializable: true,
        enumerable: true,
        value: ""
    },

    /**
     Description TODO
     @function
     @param {Function} blueprint TODO
     @returns this.initWithBlueprintAndSelector(blueprint, null)
     */
    initWithBlueprint: {
        enumerable: true,
        value: function(blueprint) {
            return this.initWithBlueprintAndSelector(blueprint, null);
        }
    },
    /**
     Description TODO
     @function
     @param {Function} blueprint TODO
     @param {Selector} selector TODO
     @returns itself
     */
    initWithBlueprintAndSelector: {
        enumerable: true,
        value: function(blueprint, selector) {
            this.blueprint = blueprint;
            Object.defineProperty(this, "blueprint", {writable: false});
            if ((selector != null) && (typeof selector === 'object')) {
                this.selector = selector;
            } else {
                this.selector = this;
            }
            return this;
        }
    },
    /**
     Description TODO
     @function
     @param {Function} propertyPath TODO
     @returns this.selector
     */
    where: {
        value: function(propertyPath) {
            return this.selector.and.property(propertyPath)
        }
    },
    /**
     Description TODO
     @function
     @param {Function} propertyPath TODO
     @returns this.selector
     */
    property: {
        value: function(propertyPath) {
            return this.selector.and.property(propertyPath)
        }
    }

});
