/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/ui/event/composer/composer
    @requires montage
*/
var Montage = require("montage").Montage;
/**
 @class module:montage/ui/composer/composer.Composer
 @extends module:montage.Montage
 */
exports.Composer = Montage.create(Montage, /** @lends module:montage/ui/composer/composer.Composer# */ {

    _component: {
        value: null
    },

    _element: {
        value: null
    },

    _needsFrame: {
        value: false
    },

    /**
     * A composer calls this method in order to be part of an applications draw cycle.
     *
     */
    needsFrame: {
        set: function(value) {
            if (this._needsFrame !== value) {
                this._needsFrame = value;
                if (this._component) {
                    if (value) {
                        this._component.scheduleComposer(this);
                    }
                }
            }
        },
        get: function() {
            return this._needsFrame;
        }
    },

    frame: {
        value: function(timestamp) {

        }
    },

    /**
     * This method is called when a component adds a composer
     */
    prepare: {
        value: function() {

        }
    },

    /**
     * This method is called when a component removes a composer
     */
    tearDown: {
        value: function() {

        }
    }

});
