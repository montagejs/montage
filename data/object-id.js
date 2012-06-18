/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/object-id
 @requires montage/core/core
 @requires montage/core/uuid
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Uuid = require("core/uuid").Uuid;
var logger = require("core/logger").logger("objectId");
/**
 @class module:montage/data/object-id.ObjectId
 @extends module:montage/core/core.Montage
 */
var ObjectId = exports.ObjectId = Montage.create(Montage, /** @lends module:montage/data/object-id.ObjectId# */ {
    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isTemporary:{
        get: function () {
            return false;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    _blueprint:{
        serializable: true,
        enumerable: false,
        value:null
    },

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    blueprint:{
        get: function () {
            return this._blueprint;
        }
    }

});
/**
 @class module:montage/data/object-id.TemporaryObjectId
 */
var TemporaryObjectId = exports.TemporaryObjectId = Montage.create(ObjectId, /** @lends module:montage/data/object-id.TemporaryObjectId# */ {
    /**
     Description TODO
     @type {Property}
     @default {Boolean} true
     */
    isTemporary:{
        get: function () {
            return true;
        }
    },
    /**
     Description TODO
     @private
     */
    _uuid:{
        serializable:true,
        enumerable:false,
        value:null
    },
    /**
     Description TODO
     @function
     @returns itself
     */
    initWithBlueprint:{
        serializable:false,
        enumerable:false,
        value:function (blueprint) {
            this._blueprint = blueprint;
            this._uuid = Uuid.generate();
            if (logger.isDebug) {
                logger.debug(this, "New Temporary Object ID: " + this._uuid);
            }
            Object.freeze(this);
            return this;
        }
    }

});
