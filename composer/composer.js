/**
 * @module montage/composer/composer
 * @requires montage/core/core
 */
var Montage = require("../core/core").Montage,
    Target = require("../core/target").Target;

/**
 * The `Composer` helps to keep event normalization and calculation out of
 * specific `Component`s and in a reusable place. For example, the
 * `TranslateComposer` handles listening to different mouse and touch events
 * that represent dragging, and emits common `translate` events with helpful
 * information about the move.
 *
 * Specific composersshould specialize this `Composer` class and implement the
 * `load` and `unload` methods to attach and remove their event listeners.
 * Subclasses can also implement `frame` if they need access to their
 * component's draw cycle.
 *
 * @classdesc Abstracts a pattern of DOM events, emitting more useful,
 * higher-level events.
 * @class Composer
 * @extends Target
 */
exports.Composer = Target.specialize( /** @lends Composer# */ {

    _component: {
        value: null
    },

    /**
     * The Montage `Component` this `Composer` is attached to. Each composer is
     * attached to a single component. By default, most composer will listen to
     * DOM events on this component's element. This is also the component whose
     * draw cycle is affected by `needsFrame` and `frame`.
     * @type {Component}
     * @default null
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
     * The DOM element where the composer will listen for events. If no element
     * is specified then the composer will use the element associated with its
     * `component` property.
     *
     * Subclasses may want to set their `element` to something other than the
     * component's element during `load` for certain event patterns. One common
     * pattern is to set element to `window` to listen for events anywhere on
     * the page.
     * @type {Element}
     * @default null
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
     * This property controls when the component will call this composer's
     * `load` method, which is where the composer adds its event listeners:
     *
     * - If `false`, the component will call `load` during the next draw cycle
     *   after the composer is added to it.
     * - If `true`, the component will call `load` after its
     *   `prepareForActivationEvents`.
     *
     * Delaying the creation of event listeners can improve performance.
     * @default false
     */
    lazyLoad: {
        value: false
    },

    _needsFrame: {
        value: false
    },

    /**
     * This property should be set to 'true' when the composer wants to have
     * its `frame()` method executed during the next draw cycle. Setting this
     * property to 'true' will cause Montage to schedule a new draw cycle if
     * one has not already been scheduled.
     * @type {boolean}
     * @default false
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
     * This method will be invoked by the framework at the beginning of a draw
     * cycle. This is where a composer may implement its update logic if it
     * needs to respond to draws by its component.
     * @method
     * @param {Date} timestamp The time that the draw cycle started
     */
    frame: {
        value: function(timestamp) {

        }
    },


    /**
     * Invoked by the framework to default the composer's element to the
     * component's element if necessary.
     * @private
     */
    _resolveDefaults: {
        value: function() {
            if (this.element == null && this.component != null) {
                this.element = this.component.element;
            }
        }
    },

    /**
     * Invoked by the framework to load this composer.
     * @private
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
     * The component calls `load` on its composers when they should initialize
     * themselves. Exactly when this happens is controlled by the composer's
     * `lazyLoad` property.
     *
     * Subclasses should override `load` with their DOM initialization. Most
     * composers attach DOM event listeners to `this.element` in `load`.
     *
     * @method
     */
    load: {
        value: function() {

        }
    },

    /**
     * The `component` will call `unload` when the composer is removed from the
     * component or the component is removed.
     *
     * Subclasses should override `unload` to do any necessary cleanup, such as
     * removing event listeners.
     *
     * @method
     */
    unload: {
        value: function() {

        }
    },

    /**
     * Called when a composer is part of a template serialization. It's
     * responsible for calling `addComposer` on the component.
     * @private
     */
    deserializedFromTemplate: {
        value: function() {
            if (this.component) {
                this.component.addComposer(this);
            }
        }
    }

});
