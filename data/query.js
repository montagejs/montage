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
var Selector = require("core/selector").Selector;
var logger = require("core/logger").logger("query");
/**
 * A query is the description of the fetch of bunch of object from the backing store. It is comprised of two elements a blueprint describing what to fetch and a selector restricting the objects to fetch.
 @class module:montage/data/query.Query
 */
var Query = exports.Query = Montage.create(Montage, /** @lends module:montage/data/query.Query# */ {

    /**
     * @private
     */
    _blueprint:{
        value:null,
        serializable:true
    },

    /**
     Blueprint of the object to fetch with this query
     @type {Property}
     @default {Blueprint} null
     */
    blueprint:{
        get:function () {
            return this._blueprint;
        }
    },

    /**
     * @private
     */
    _selector:{
        value:null,
        serializable:true
    },

    /**
     Selector to use to qualify this query
     @type {Property}
     @default {Selector} null
     */
    selector:{
        get:function () {
            return this._selector;
        }
    },

    /**
     * Name of this query. The name is used when the query is stored in the binder for retrieval at run time.
     @type {Property}
     @default {String} ""
     */
    name:{
        serializable:true,
        enumerable:true,
        value:""
    },

    /**
     * @private
     */
    _parameters:{
        value:{},
        serializable:true,
        distinct:true,
        enumerable:false,
        writable:false
    },


    /**
     * Parameters to use when evaluating the selectors for this query
     @type {Property}
     @default  {String}{}
     */
    parameters:{
        get:function () {
            return this._parameters;
        }
    },

    /**
     Description TODO
     @function
     @param {Function} blueprint TODO
     @returns this.initWithBlueprintAndSelector(blueprint, null)
     */
    initWithBlueprint:{
        enumerable:true,
        value:function (blueprint) {
            return this.initWithBlueprintSelectorAndParameters(blueprint, null, null);
        }
    },

    /**
     Description TODO
     @function
     @param {Function} blueprint TODO
     @param {Selector} selector TODO
     @returns itself
     */
    initWithBlueprintAndSelector:{
        enumerable:true,
        value:function (blueprint, selector) {
            return this.initWithBlueprintSelectorAndParameters(blueprint, selector, null);
        }
    },

    /**
     Description TODO
     @function
     @param {Function} blueprint TODO
     @param {Selector} selector TODO
     @param {Dictionary} parameters TODO
     @returns itself
     */
    initWithBlueprintSelectorAndParameters:{
        enumerable:true,
        value:function (blueprint, selector, parameters) {
            this._blueprint = blueprint;
            if (selector != null) {
                if (Selector.isPrototypeOf(selector)) {
                    this._selector = selector;
                } else {
                    throw new Error("Selector is not a selector: " + JSON.stringify(selector));
                }
            }
            if (parameters != null) {
                var parametersNames = Object.getOwnPropertyNames(parameters);
                var parameter, parameterName, index;
                for (index = 0; typeof (parameterName = parametersNames[index]) !== "undefined"; index++) {
                    parameter = parameters[parameterName];
                    this._parameters[parameterName] = parameter;
                }
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
    where:{
        value:function (selector) {
            if (selector != null) {
                if (Selector.isPrototypeOf(selector)) {
                    this._selector = selector;
                } else {
                    throw new Error("Selector is not a selector: " + JSON.stringify(selector));
                }
            }
            return this;
        }
    }

});
