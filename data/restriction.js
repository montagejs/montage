/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/restriction
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var logger = require("core/logger").logger("restrictions");
/**
 * A restriction is global mask applied to every query made in change context. It enables for example the management of version of access right.<br/>
 * Selectors attached to a restriction are added to any query on the blueprints.
 @class module:montage/data/restriction.Restriction
 @extends module:montage/core/core.Montage
 */
var Restriction = exports.Restriction = Montage.create(Montage, /** @lends module:montage/data/restriction.Restriction# */ {

    /**
     * @private
     */
    _name:{
        serializable:true,
        enumerable:true,
        value:""
    },

    /**
     * Name of this restriction. The name is used when the restriction is stored in the binder for retrieval at run time.<br/>
     * It is also used to retrieve selectors to apply at run time.
     @type {Property}
     @default {String} ""
     */
    name:{
        get:function () {
            return this._name;
        }
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
     * Parameters to use when evaluating the selectors for this restriction
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
     @param {String} name To be initialized
     @param {String} parameters To be initialized
     @returns itself
     */
    initWithNameAndParameters:{
        enumerable:false,
        value:function (name, parameters) {
            this._name = (name != null ? name : "default");
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
    }

});
