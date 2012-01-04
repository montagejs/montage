/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module montage/data/restriction
    @requires montage/core/core
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
// var Selector = require("data/selector").Selector;
var logger = require("core/logger").logger("restrictions");
/**
    @class module:montage/data/restriction.Restriction
    @extends module:montage/core/core.Montage
*/
var Restriction = exports.Restriction = Montage.create(Montage,/** @lends module:montage/data/restriction.Restriction# */ {
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
        @type {Property}
        @default  {String}{}
    */
    parameters: {
        value: {},
        serializable: true,
        distinct: true,
        enumerable: false,
        writable: false
    },
/**
    Description TODO
    @function
    @param {String} name To be initialized
    @param {String} parameters To be initialized
    @returns itself
    */
    initWithNameAndParameters: {
        enumerable: false,
        value: function(name, parameters) {
            this.name = (name != null ? name : "default");
            Object.defineProperty(this, "name", {writable: false});
            if (parameters != null) {
                var parametersNames = Object.getOwnPropertyNames(parameters);
                var parameter, parameterName, index;
                for (index = 0; typeof (parameterName = parametersNames[index]) !== "undefined"; index++) {
                    parameter = parameters[parameterName];
                    this.parameters[parameterName] = parameter;
                }
            }
            Object.freeze(this.parameters);
            return this;
        }
    }

});
