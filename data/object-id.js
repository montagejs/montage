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
