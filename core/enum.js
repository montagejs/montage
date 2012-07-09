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
