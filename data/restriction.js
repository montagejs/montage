/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
var Restriction = exports.Restriction = Montage.create(Montage, /** @lends module:montage/data/restriction.Restriction# */ {
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
