 /*global require, exports*/

/**
    @module "montage/ui/native/button.reel"
*/
var Control = require("ui/control").Control,
    KeyComposer = require("composer/key-composer").KeyComposer,
    PressComposer = require("composer/press-composer").PressComposer;

// TODO migrate away from using undefinedGet and undefinedSet

/**
    Wraps a native <code>&lt;button></code> or <code>&lt;input[type="button"]></code> HTML element. The element's standard attributes are exposed as bindable properties.
    @class module:"montage/ui/native/button.reel".Button
    @extends module:montage/ui/control.Control
    @fires action
    @fires hold
    @example
<caption>JavaScript example</caption>
var b1 = new Button();
b1.element = document.querySelector("btnElement");
b1.addEventListener("action", function(event) {
    console.log("Got event 'action' event");
});
    @example
<caption>Serialized example</caption>
{
    "aButton": {
        "prototype": "montage/ui/native/button.reel",
        "values": {
            "element": {"#": "btnElement"}
        },
        "listeners": [
            {
                "type": "action",
                "listener": {"@": "appListener"}
            }
        ]
    },
    "listener": {
        "prototype": "appListener"
    }
}
&lt;button data-montage-id="btnElement"></button>
*/

var Button = exports.Button = Control.specialize(/** @lends module:"montage/ui/native/button.reel".Button# */ {

    /**
        Dispatched when the button is activated through a mouse click, finger tap,
        or when focused and the spacebar is pressed.

        @event action
        @memberof module:"montage/ui/native/button.reel".Button
        @param {Event} event
    */

    /**
        Dispatched when the button is pressed for a period of time, set by
        {@link holdThreshold}.

        @event hold
        @memberof module:"montage/ui/native/button.reel".Button
        @param {Event} event
    */

    standardElementTagName: {
        value: "BUTTON"
    },

    /* TODO: remove when adding template capability */
    hasTemplate: {
        value: false
    },

    drawsFocusOnPointerActivation : {
        value: true
    },

    /**
        converter
        A Montage converter object used to convert or format the label displayed by the Button instance. When a new value is assigned to <code>label</code>, the converter object's <code>convert()</code> method is invoked, passing it the newly assigned label value.
        @type {Property}
        @default null
    */

    /**
      Stores the node that contains this button's value. Only used for
      non-`<input>` elements.
      @private
    */
    _labelNode: {value:undefined, enumerable: false},

    _label: { value: undefined, enumerable: false },
    _emptyLabel: { value: "", enumerable: false },

    /**
        The displayed text on the button. In an &lt;input> element this is taken from the element's <code>value</code> attribute. On any other element (including &lt;button>) this is the first child node which is a text node. If one isn't found then it will be created.

        If the button has a non-null <code>converter</code> property, the converter object's <code>convert()</code> method is called on the value before being assigned to the button instance.

        @type {string}
        @default undefined
    */
    label: {
        get: function () {
            return this._label;
        },
        set: function (value) {
            if (typeof value !== "undefined" && this.converter) {
                try {
                    value = this.converter.convert(value);
                    if (this.error) {
                        this.error = null;
                    }
                } catch(e) {
                    // unable to convert - maybe error
                    this.error = e;
                }
            }

            this._label = String(value);

            if (this.isInputElement) {
                this._value = value;
            }

            this.needsDraw = true;
        }
    },

    // setLabelInitialValue: {
    //     value: function(value) {
    //         if (this._label === undefined) {
    //                 this._label = value;
    //             }
    //     }
    // },

    _promise: {
        value: undefined
    },

    promise: {
        get: function () {
            return this._promise;
        },
        set: function (value) {
            var self = this;
            var test = function promiseResolved(){
                            if (promiseResolved.promise === self._promise){
                                self.classList.remove('montage--pending');
                                self._promise = undefined;
                            }
                        };

            if (this._promise !== value) {
                this._promise = value;

                if (this._promise){
                    this.classList.add('montage--pending')
                    test.promise = value;
                    this._promise.then(test);
                }
            }
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

    __spaceKeyComposer: {
        value: null
    },

    _spaceKeyComposer: {
        get: function () {
            if (!this.__spaceKeyComposer) {
                this.__spaceKeyComposer = KeyComposer.createKey(this, "space", "space");
            }
            return this.__spaceKeyComposer;
        }
    },

    _enterKeyComposer: {
        get: function () {
            if (!this.__enterKeyComposer) {
                this.__enterKeyComposer = KeyComposer.createKey(this, "enter", "enter");
            }
            return this.__enterKeyComposer;
        }
    },

    // HTMLInputElement/HTMLButtonElement methods
    // click() deliberately omitted (it isn't available on <button> anyways)

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("pressStart", this, false);
            this._spaceKeyComposer.addEventListener("keyPress", this, false);
            this._enterKeyComposer.addEventListener("keyPress", this, false);
        }
    },

    handleKeyPress: {
        value: function (mutableEvent) {
            // when focused action event on spacebar & enter
            // FIXME - property identifier is not set on the mutable event
            if (mutableEvent._event.identifier === "space" ||
                mutableEvent._event.identifier === "enter") {
                this.active = false;
                this._dispatchActionEvent();
            }
        }
    },

    // Optimisation
    addEventListener: {
        value: function (type, listener, useCapture) {
            Control.prototype.addEventListener.call(this, type, listener, useCapture);
            if (type === "longAction") {
                this._pressComposer.addEventListener("longPress", this, false);
            }
        }
    },

    _addEventListeners: {
        value: function () {
            this._pressComposer.addEventListener("press", this, false);
            this._pressComposer.addEventListener("pressCancel", this, false);

            //fixme: @benoit: we should maybe have a flag for this kind of event.
            // can be tricky with the event delegation for example if we don't add it.
            // same issue for: the pressComposer and the translate composer.
            this._pressComposer.addEventListener("longPress", this, false);
        }
    },

    _removeEventListeners: {
        value: function () {
            this._pressComposer.removeEventListener("press", this, false);
            this._pressComposer.removeEventListener("pressCancel", this, false);
            this._pressComposer.removeEventListener("longPress", this, false);
        }
    },

    // Handlers

    /**
    Called when the user starts interacting with the component.
    */
    handlePressStart: {
        value: function (event) {
            if (!this._promise){
                this.active = true;
                this._addEventListeners();
            }
        }
    },

    /**
    Called when the user has interacted with the button.
    */
    handlePress: {
        value: function (event) {
            if (!this._promise){
                this.active = false;
                this._dispatchActionEvent();
                this._removeEventListeners();
            }
        }
    },

    handleLongPress: {
        value: function(event) {
            if (!this._promise){
                // When we fire the "hold" event we don't want to fire the
                // "action" event as well.
                this._pressComposer.cancelPress();
                this._removeEventListeners();

                var longActionEvent = document.createEvent("CustomEvent");
                longActionEvent.initCustomEvent("longAction", true, true, null);
                this.dispatchEvent(longActionEvent);
            }
        }
    },

    /**
    Called when all interaction is over.
    @private
    */
    handlePressCancel: {
        value: function(event) {
            this.active = false;
            this._removeEventListeners();
        }
    },

    /**
    If this is an input element then the label is handled differently.
    @private
    */
    _isInputElement: {
        value: undefined,
        enumerable: false
    },
    isInputElement: {
        get: function() {
            return this._isInputElement !== undefined ? this._isInputElement : (this._isInputElement = (this.element ? (this.element.tagName === "INPUT") : false));
        },
        enumerable: false
    },

    enterDocument: {
        value: function (firstDraw) {
            if (Control.prototype.enterDocument) {
                Control.prototype.enterDocument.apply(this, arguments);
            }

            if (firstDraw) {
                // Only take the value from the element if it hasn't been set
                // elsewhere (i.e. in the serialization)
                if (this.isInputElement) {
                    // NOTE: This might not be the best way to do this
                    // With an input element value and label are one and the same
                    Object.defineProperty(this, "value", {
                        get: function() {
                            return this._label;
                        },
                        set: function(value) {
                            this.label = value;
                        }
                    });

                    if (this._label === undefined) {
                        this.label = this.originalElement.value;
                    }
                    //<button> && Custom
                } else {
                    if(!this.originalElement !== this.element && this._label === undefined) {
                        this._label = this.originalElement.data;
                    }
                    if (!this.element.firstChild) {
                        this.element.appendChild(document.createTextNode(""));
                    }
                    this._labelNode = this.element.firstChild;
                    // this.setLabelInitialValue(this._labelNode.data)
                    // if (this._label === undefined) {
                    //     this._label = this._labelNode.data;
                    // }
                }

                //this.classList.add("montage-Button");
                this.element.setAttribute("role", "button");
                this.element.addEventListener("keyup", this, false);
            }
        }
    },

    /**
    Draws the label to the DOM.
    @function
    @private
    */
    _drawLabel: {
        enumerable: false,
        value: function (value) {
            if(typeof value !== "string") {
                value = this._emptyLabel;
            }
            if (this.isInputElement) {
                this._element.value = value;
            } else if (this._labelNode) {
                this._labelNode.data = value;
            }
        }
    },


    draw: {
        value: function () {
            this.super();
            this._drawLabel(this._label);
        }
    }

});

Button.addAttributes( /** @lends module:"montage/ui/native/button.reel".Button# */{

/**
    The URL to which the form data will be sumbitted.
    @type {string}
    @default null
*/
    formaction: null,

/**
    The content type used to submit the form to the server.
    @type {string}
    @default null
*/
    formenctype: null,

/**
    The HTTP method used to submit the form.
    @type {string}
    @default null
*/
    formmethod: null,

/**
    Indicates if the form should be validated upon submission.
    @type {boolean}
    @default null
*/
    formnovalidate: {dataType: 'boolean'},

/**
    The target frame or window in which the form output should be rendered.
    @type string}
    @default null
*/
    formtarget: null,

/**
    A string indicating the input type of the component's element.
    @type {string}
    @default "button"
*/
    type: {value: 'button'},

/**
    The name associated with the component's DOM element.
    @type {string}
    @default null
*/
    name: null,

/**
    <strong>Use <code>label</code> to set the displayed text on the button</strong>
    The value associated with the element. This sets the value attribute of
    the button that gets sent when the form is submitted.
    @type {string}
    @default null
    @see label
*/
    value: null

});
