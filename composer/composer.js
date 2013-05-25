/**
 * @module montage/composer/composer
 * @requires montage/core/core
 */
var Montage = require("montage").Montage,
    Target = require("core/target").Target;
/**
 * @class Composer
 * @extends Target
 * @summary The Composer prototype is the base class for all composers in Montage. There are two types of composers. One type, called _gesture_ composers listen for and aggregrate low-level events into higher order events (for example, [PressComposer]{@link PressComposer}. The second type of composer is called _calculation_ composers
 */
exports.Composer = Target.specialize( /** @lends Composer# */ {

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
