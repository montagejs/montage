/**
 * @module "ui/cascading-list-dropzone.reel"
 */
var Component = require("../../../component").Component;

/**
 * @class CascadingListDropzone
 * @extends Component
 * 
 * TODO:
 * 
 * - Add a visible drawer or not
 * - Dispatch open and close event
 * - swipe up to close it or down if there is a visible drawer
 * - long press could also be used for re-organize mode
 */
exports.CascadingListDropzone = Component.specialize({

    enterDocument: {
        value: function () {
            this.element.addEventListener("transitionend", this);
        }
    },

    exitDocument: {
        value: function () {
            this.element.removeEventListener("transitionend", this);
        }
    },

    _isOpened: {
        value: false
    },

    isOpened: {
        get: function () {
            return this._isOpened;
        }
    },

    open: {
        value: function (noTransition) {
            if (!this._isOpened) {
                this._noTransition = !!noTransition;
                this._shouldOpen = true;
                this._shouldClose = false;
                this.needsDraw = true;
            }
        }
    },

    close: {
        value: function (noTransition) {
            if (this._isOpened) {
                this._noTransition = !!noTransition;
                this._shouldClose = true;
                this._shouldOpen = false;
                this.needsDraw = true;                
            }
        }
    },

    handleCloseAction: {
        value: function () {
            this.close();
        }
    },

    handleTransitionend: {
        value: function (event) {
            if (event.target === this.element) {
                if (this._shouldClose) {
                    this.removeEventListener("action", this);
                    this._noTransition = false;
                    this._shouldClose = false;
                    this._isOpened = false;
                    this.needsDraw = true;

                } else if (this._shouldOpen) {
                    this.addEventListener("action", this);
                    this._noTransition = false;
                    this._shouldOpen = false;
                    this._isOpened = true;
                    this.needsDraw = true;
                }
            }
        }
    },

    draw: {
        value: function () {
            if (!this._noTransition) {
                if (this._shouldOpen) {
                    this.classList.add('open-transition');
                } else {
                    this.classList.remove('open-transition');
                }

                if (this._shouldClose) {
                    this.classList.add('close-transition');
                } else {
                    this.classList.remove('close-transition');
                }
            } else {
                this.classList.remove('open-transition');
                this.classList.remove('close-transition');

                if (this._shouldOpen) {
                    this.addEventListener("action", this);
                    this._isOpened = true;
                } else if (this._shouldClose) {
                    this._isOpened = false;
                    this.removeEventListener("action", this);
                }
            }
        }
    }

});
