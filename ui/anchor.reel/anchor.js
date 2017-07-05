/**
    @module "montage/ui/anchor.reel"
*/
var Control = require("ui/control").Control,
    PressComposer = require("../../composer/press-composer").PressComposer;

var CLASS_PREFIX = "montage-Link";
/**
  The Anchor component wraps a native <code>&lt;a&gt;</code> element and exposes its standard attributes as bindable properties.
  @class module:"montage/ui/anchor.reel".Anchor
  @extends module:montage/ui/control.Control

*/
var Anchor = exports.Anchor = Control.specialize({

    // HTMLAnchorElement methods
    blur: { value: function() { this._element.blur(); } },

    focus: { value: function() { this._element.focus(); } },

    hasTemplate: {value: false },
        
    _href: {
        value: null
    },

    href: {
        set: function (value) {
            this._href = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._href;
        }
    },
    
    /**
        The amount of time in milliseconds the user must press and hold the button a <code>hold</code> event is dispatched. The default is 1 second.
        @type {number}
        @default 1000
    */
    holdThreshold: {
        get: function () {
            return this._pressComposer.longPressThreshold;
        },
        set: function (value) {
            this._pressComposer.longPressThreshold = value;
        }
    },

    __pressComposer: {
        enumerable: false,
        value: null
    },

    _pressComposer: {
        enumerable: false,
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.addComposer(this.__pressComposer);
            }

            return this.__pressComposer;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
              
            }
        }
    },

    handlePressStart: {
        value: function (event) {
            this.active = true;

            if (event.touch) {
                // Prevent default on touchmove so that if we are inside a scroller,
                // it scrolls and not the webpage
                document.addEventListener("touchmove", this, false);
            }
        }
    },

    /**
     * Handles press event from press composer.
     * @private
     */
    handlePress: {
        value: function (/* event */) {
            this.active = false;

            if (this.disabled) {
                return;
            }

            this.dispatchActionEvent();
        }
    },

    /**
     * Called when all interaction is over.
     * @private
     */
    handlePressCancel: {
        value: function (/* event */) {
            this.active = false;
            document.removeEventListener("touchmove", this, false);
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);
        }
    }

});

Anchor.addAttributes( /** @lends module:"montage/ui/anchor.reel".Anchor# */ {

/**
    The text displayed by the link.
    @type string
    @default null
*/
    textContent: null,

/**
    The link target URL.
    @type string
    @default null
*/
    href: null,

/**
    The language of the linked resource.
    @type string
    @default null
*/
    hreflang: null,

/**
     The media type for which the target document was designed.
    @type string
     @default null
*/
    media: null,

/**
    Controls what kinds of links the elements create.
    @type string
    @default null
*/
    rel: null,

/**
     The target window the link will open in.
     @type string
     @default null
*/
    target: null,

/**
     The MIME type of the linked resource.
     @type string
     @default null
*/
    type: null
});
