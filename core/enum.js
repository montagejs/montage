/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/core/enum
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage,
    logger = require("core/logger").logger("enum");
/**
 @class module:montage/core/enum.Enum
 @extends module:montage/core/core.Montage
 */
exports.Enum = Montage.create(Montage, /** @lends module:montage/core/enum.Enum# */ {
/**
  @private
*/
    _value: {
        value: 0
    },
/**
    @function
    @returns itself
    */
    init : {
        value: function() {
            if (Object.isSealed(this)) {
                logger.error(this, "Object is sealed");
            }
            return this;
        }
    },
/**
    @function
    @returns {Object} Object.seal(this)
    */
    initWithMembers : {
        value: function() {
            if (Object.isSealed(this)) {
                logger.error(this, "Object is sealed");
                return this;
            }
            var member, i;
            for (i = 0; typeof (member = arguments[i]) !== "undefined"; i++) {
                if (member !== null) {
                    this.addMember(member);
                } else {
                    logger.error(this, "Member at index " + i + " is null");
                }
            }
            return Object.seal(this);
        }
    },
/**
    @function
    @param {String} member The member to be added.
    */
    addMember : {
        value: function(member) {

            if (typeof this[member] === "undefined") {
                Object.defineProperty(this, member, {
                    writable: false,
                    configurable: false,
                    enumerable: true,
                    value: this._value
                });
                this._value++;
            }
        }
    },
/**
    @function
    @returns {Object} Object.seal(this)
    */
    seal : {
        value: function() {
            if (! Object.isSealed(this)) {
                return Object.seal(this);
            }
        }
    }
});
