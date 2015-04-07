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

    _userActionPromise: {
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
        value: function (firstTime) {
            var constructor;

            if (firstTime) {
                // If the instance entering the document is the singleton of
                // its constructor then we need to resolve the promise to start
                // the chain of messages that might be pending.
                constructor = Object.getPrototypeOf(this).constructor;
                if (this === constructor._instance) {
                    constructor._nextMessagePromiseHandlerResolve();
                }
                this._okButton.addEventListener("action", this, false);
            }
        }
    },
    
    resolveUserAction: {
        value: null
    },
    rejectUserAction: {
        value: null
    },

    /**
     * Returns a promise for the close of the alert
     */
    show: {
        value: function() {
            if (!this._userActionPromise) {
                this._overlay.hasModalMask = false;
                this._overlay.show();
                var self = this;
                this._userActionPromise = new Promise(function(resolve, reject) {
                    self.resolveUserAction = resolve;
                    self.rejectUserAction = reject;
                });
            }

            return this._userActionPromise;
        }
    },

    handleAction: {
        value: function (event) {
            if (event.target === this._okButton) {
                this.resolveUserAction();
                this._userActionPromise = null;
                this._overlay.hide();
            }
        }
    }
}, {
    _instance: {
        value: null
    },

    /**
     * This promise is initially the promise at _nextMessagePromise and is
     * resolved at enterDocument time, this is when the overlay is available.
     
     * Implemented with a getter to ensure that this property is not initialized
     * on the AbstractAlert but on the type that extends it.
     
     */
     _nextMessagePromiseHandlerResolve: {
         value: null
     },
     _nextMessagePromiseHandlerReject: {
         value: null
     },
    __nextMessagePromise: {
        value: null
    },

    _nextMessagePromise: {
        set: function (value) {
            this.__nextMessagePromise = value;
        },
        get: function () {
            if (!this.hasOwnProperty("__nextMessagePromise")) {
                var self = this;
                this.__nextMessagePromise = new Promise(function(resolve, reject) {
                     self._nextMessagePromiseHandlerResolve = resolve;
                     self._nextMessagePromiseHandlerReject = reject;
                 });
            }

            return this.__nextMessagePromise;
        }
    },

    _setupInstance: {
        value: function () {
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
        value: function (message, title) {
            var instance,
                self = this;

            if (!this.hasOwnProperty("_instance")) {
                this._setupInstance();
            }

            instance = this._instance;

            return this._nextMessagePromise = this._nextMessagePromise.then(function () {
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
