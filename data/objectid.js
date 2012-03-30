/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/objectid
 @requires montage/core/core
 @requires montage/core/uuid
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Uuid = require("core/uuid").Uuid;
var logger = require("core/logger").logger("objectid");
/**
 @class module:montage/data/objectid.ObjectId
 @extends module:montage/core/core.Montage
 */
var ObjectId = exports.ObjectId = Montage.create(Montage, /** @lends module:montage/data/objectid.ObjectId# */ {
    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isTemporary: {
        value: false
    },
    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    blueprint: {
        value: null
    }

});
/**
 @class module:montage/data/objectid.TemporaryObjectId
 */
var TemporaryObjectId = exports.TemporaryObjectId = Montage.create(ObjectId, /** @lends module:montage/data/objectid.TemporaryObjectId# */ {
    /**
     Description TODO
     @type {Property}
     @default {Boolean} true
     */
    isTemporary: {
        value: true
    },
    /**
     Description TODO
     @private
     */
    _uuid: {
        serializable: true,
        enumerable: false,
        value: null
    },
    /**
     Description TODO
     @function
     @returns itself
     */
    init: {
        serializable: false,
        enumerable: false,
        value: function() {
            this._uuid = Uuid.generate();
            if (logger.isDebug) {
                logger.debug(this, "New Temporary Object ID: " + this._uuid);
            }
            Object.freeze(this);
            return this;
        }
    }

});
