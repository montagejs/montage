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
	@module montage/ui/composer/composer
    @requires montage/core/core
*/
var Montage = require("montage").Montage;
/**
 @class module:montage/ui/composer/composer.Composer
 @extends module:montage/core/core.Montage
 @summary The Composer prototype is the base class for all composers in Montage. There are two types of composers. One type, called _gesture_ composers listen for and aggregrate low-level events into higher order events (for example, [PressComposer]{@link module:montage/ui/composer/press-composer.PressComposer}. The second type of composer is called _calculation_ composers
 */
exports.Composer = Montage.create(Montage, /** @lends module:montage/ui/composer/composer.Composer# */ {

    _component: {
        value: null
    },

/**
    The Montage component that the composer will listen for mouse events on.
    @type {Component}
    @default null
*/
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

/**
    The DOM element that the composer will listen for events on. If no element is specified then the composer will use the element associated with its <code>component</code> property.
    @type {Component}
    @default null
*/
    element: {
        get: function() {
            return this._element;
        },
        set: function(element) {
            this._element = element;
        }
    },


    /**
     * This property controls when a composer's <code>load()</code> method is called, which is where the composer create event listeners. If `false`
     * the composer's <code>load()</code> method is called immediately as part of the next draw
     * cycle after <code>addComposer()</code> has been called on its associated component.  If
     * `true`, the loading of the composer is delayed until its associated component
     * has had its <code>prepareForActivationEvents()</code> called. Delaying the creation of event listeners until necessary can improve performance.
     * @default false
     */
    lazyLoad: {
        value: false
    },

    _needsFrame: {
        value: false
    },

    /**
        This property should be set to 'true' when the composer wants to have its <code>frame()</code> method executed during the next draw cycle.Setting this property to 'true' will cause Montage to schedule a new draw cycle if one has not already been.
        @type {boolean}
        @default false
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
        This method will be invoked by the framework at the beginning of a draw cycle. This is where a composer implement its update logic.
        @function
        @param {Date} timestamp The time that the draw cycle started
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
            if (this.element == null && this.component != null) {
                this.element = this.component.element;
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
        @private
     */
    deserializedFromTemplate: {
        value: function() {
            if (this.component) {
                this.component.addComposer(this);
            }
        }
    }

});
