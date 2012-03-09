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

    component: {
        get: function() {
            return this._component;
        },
        set: function(component) {
            this._component = component;
        }
    },

    _element: {
        value: null
    },

    element: {
        get: function() {
            return this._element;
        },
        set: function(element) {
            this._element = element;
        }
    },


    /**
     * This property controls when a composer's load method is called.  If `false`
     * the composer's load method is called immediately as part of the next draw
     * cycle after addComposer has been called on its associated component.  If
     * `true` loading of the composer is delayed until its associated component
     * has prepareForActivationEvents called.
     * @default false
     */
    lazyLoad: {
        value: false
    },

    _needsFrame: {
        value: false
    },

    /**
        This property should be set to true when this composer wants to have its
        frame method executed during the next draw cycle.  Setting this property
        to true will cause a draw cycle to be scheduled iff one is not already
        scheduled.
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

    /**
        This method will be invoked by the framework at the beginning of a draw cycle. This is the method where
        a composer should implement its update logic.
        @param {Date} timestamp time that the draw cycle started
     */
    frame: {
        value: function(timestamp) {

        }
    },


    /*
        Invoked by the framework to default the composer's element to the component's element if necessary.
        @private
     */
    _resolveDefaults: {
        value: function() {
            if (this.element == null) {
                if (this.component != null) {
                    this.element = this.component.element;
                }
            }
        }
    },

    /*
        Invoked by the framework to load this composer
        @private
     */
    _load: {
        value: function() {
            if (!this.element) {
                this._resolveDefaults();
            }
            this.load();
        }
    },

    /**
        Called when a composer should be loaded.  Any event listeners that the composer needs to install should
        be installed in this method.
        @function
     */
    load: {
        value: function() {

        }
    },

    /**
        Called when a component removes a composer.  Any event listeners that the composer needs to remove should
        be removed in this method and any additional cleanup should be performed.
        @function
     */
    unload: {
        value: function() {

        }
    },

    /*
        Called when a composer is part of a template serialization.  It's responsible for calling addComposer on
        the component.
     */
    deserializedFromTemplate: {
        value: function() {
            if (this.component) {
                this.component.addComposer(this);
            }
        }
    }

});
