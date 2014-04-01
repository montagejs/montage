/**
 * @module ui/alert.reel
 */
var Component = require("../component").Component,
    ModalOverlay = require("../modal-overlay.reel").ModalOverlay,
    Promise = require("../../core/promise").Promise;

/**
 * @class Alert
 * @extends Component
 */
exports.AbstractAlert = Component.specialize(/** @lends AbstractAlert# */ {
    constructor: {
        value: function AbstractAlert() {
            if (this.constructor === AbstractAlert) {
                throw new Error("AbstractAlert cannot be instantiated.");
            }
        }
    },

    /**
     * This property should point to the overlay component.
     */
    _overlay: {
        value: null
    },

    /**
     * This property should point to the "OK" "action" component.
     */
    _okButton: {
        value: null
    },

    _userActionDeferred: {
        value: null
    },

    title: {
        value: "Alert"
    },

    okLabel: {
        value: "OK"
    },

    message: {
        value: null
    },

    enterDocument: {
        value: function(firstTime) {
            var constructor;

            if (firstTime) {
                // If the instance entering the document is the singleton of
                // its constructor then we need to resolve the promise to start
                // the chain of messages that might be pending.
                constructor = Object.getPrototypeOf(this).constructor;
                if (this === constructor._instance) {
                    constructor._nextMessageDeferred.resolve();
                }
                this._okButton.addEventListener("action", this, false);
            }
        }
    },

    /**
     * Returns a promise for the close of the alert
     */
    show: {
        value: function() {
            if (!this._userActionDeferred) {
                this._overlay.hasModalMask = false;
                this._overlay.show();
                this._userActionDeferred = Promise.defer();
            }

            return this._userActionDeferred.promise;
        }
    },

    handleAction: {
        value: function(event) {
            if (event.target === this._okButton) {
                this._userActionDeferred.resolve();
                this._userActionDeferred = null;
                this._overlay.hide();
            }
        }
    }
}, {
    _instance: {
        value: null
    },

    __nextMessageDeferred: {
        value: null
    },

    /**
     * Implemented with a getter to ensure that this property is not initialized
     * on the AbstractAlert but on the type that extends it.
     */
    _nextMessageDeferred: {
        get: function() {
            if (!this.hasOwnProperty("__nextMessageDeferred")) {
                this.__nextMessageDeferred = Promise.defer();
            }

            return this.__nextMessageDeferred;
        }
    },

    /**
     * This promise is initially the promise at _nextMessageDeferred and is
     * resolved at enterDocument time, this is when the overlay is available.
     */
    __nextMessagePromise: {
        value: null
    },

    _nextMessagePromise: {
        set: function(value) {
            this.__nextMessagePromise = value;
        },
        get: function() {
            if (!this.hasOwnProperty("__nextMessagePromise")) {
                this.__nextMessagePromise = this._nextMessageDeferred.promise;
            }

            return this.__nextMessagePromise;
        }
    },

    _setupInstance: {
        value: function() {
            var instance;

            instance = this._instance = new this();
            // HACK: outside of the draw cycle, no other way to do it at the
            // moment we need the DrawManager to solve this problem.
            instance.element = instance.rootComponent.element.createElement("div");
            instance.element.ownerDocument.body.appendChild(instance.element);
            instance.attachToParentComponent();

            instance.needsDraw = true;
        }
    },

    show: {
        value: function(message, title) {
            var instance,
                self = this;

            if (!this.hasOwnProperty("_instance")) {
                this._setupInstance();
            }

            instance = this._instance;

            return this._nextMessagePromise = this._nextMessagePromise.then(function() {
                if (title) {
                    instance.title = title;
                } else {
                    instance.title = self.prototype.title;
                }
                instance.message = message;

                return instance.show();
            });
        }
    }
});
