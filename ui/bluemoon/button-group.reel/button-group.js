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
	@module "montage/ui/bluemoon/button-group.reel"
    @requires montage/core/core
    @requires "montage/ui/component-group.reel"
*/
var Montage = require("montage").Montage,
    ComponentGroup = require("ui/component-group.reel").ComponentGroup;

/**
 @class module:"montage/ui/bluemoon/button-group.reel".ButtonGroup
 @classdesc A group of buttons, displayed "pill" style.
 @extends module:montage/ui/component.Component
 */
var ButtonGroup = exports.ButtonGroup = Montage.create(ComponentGroup, /** @lends module:"montage/ui/bluemoon/button-group.reel".ButtonGroup */ {
/**
    Description TODO
    @type {Boolean}
    @default true
*/
    hasTemplate: {
        value: true
    },

/**
  Description TODO
  @private
*/
    _iconic: {
        value: false
    },

    /**
     Sets wether or not to hide button text for buttons with icons.
     @type {Function}
     @default {Boolean} false
     */
    iconic: {
        get: function() {
            return this._iconic;
        },
        set: function(value) {
            if (this._iconic !== value) {
                this._iconic = value;
                this.needsDraw = true;
            }
        }
    },

/**
    Description TODO
    @function
    */
    prepareForDraw: {
        value: function() {
            this.element.classList.add("montage-ButtonGroup");
        }
    },

/**
    Description TODO
    @function
    */
    draw: {
        value: function() {
            if (this._iconic) {
                this.element.classList.add("iconic");
            } else {
                this.element.classList.remove("iconic");
            }
        }
    }
});
