/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/image.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;
/**
 @class module:"montage/ui/image.reel".Image
 @extends module:montage/ui/component.Component
 */
exports.Image = Montage.create(Component, /** @lends module:"montage/ui/image.reel".Image# */ {

    hasTemplate: {
        enumerable: false,
        value: false
    },
/**
  Description TODO
  @private
*/
    _photo: {
        enumerable: false,
        value: null
    },
/**
        Description TODO
        @type {Function}
        @default null
    */
    src: {
        get: function() {
            return this._photo;
        },
        set: function(value) {
            if (this._photo !== value) {
                this.needsDraw = true;
            }
            this._photo = value;
        }
    },
/**
        Description TODO
        @type {Property}
        @default {String} ""
    */
    defaultSrc: {
        value: ""
    },
/**
    Description TODO
    @function
    */
    draw: {
        value: function() {
            this.element.src = this._photo != null ? this._photo : this.defaultSrc;
        }
    }

});
