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
	@module "montage/ui/substitution.reel"
    @requires montage/ui/component
    @requires "montage/ui/slot.reel"
    @requires montage/core/logger
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    Slot = require("ui/slot.reel").Slot,
    logger = require("core/logger").logger("substitution");
/**
 @class module:"montage/ui/substitution.reel".Substitution
 */
exports.Substitution = Montage.create(Slot, /** @lends module:"montage/ui/substitution.reel".Substitution# */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },

    /**
        Description TODO
        @type {Property}
        @default {}
    */
    switchComponents: {
        distinct: true,
        value: {}
    },

    /**
      Description TODO
      @private
    */
    _switchValue: {
        value: null
    },

    /**
        Description TODO
        @type {Function}
        @default null
    */
    switchValue: {
        get: function() {
            return this._switchValue;
        },
        set: function(value) {

            if (this._switchValue === value || this._isSwitchingContent) {
                return;
            }

            this._switchValue = value;

            if (this.switchComponents) {
                this.content = this.switchComponents[this.switchValue];
            }
        }
    },

    /**
        Description TODO
        @type {Property}
        @default null
    */
    transition: {
        value: null
    }
});
