/**
 * @module "ui/cascading-list-dropzone.reel"
 */
var Component = require("../../component").Component;

/**
 * @class CascadingListShelf
 * @extends Component
 * 
 * TODO:
 * 
 * - Add a visible drawer or not
 * - swipe up to close it or down if there is a visible drawer
 */
exports.CascadingListShelf = Component.specialize({

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

    isOpened: {
        value: false
    },

    acceptDrop: {
        value: false
    },

    willDrop: {
        value: false
    },

    open: {
        value: function (noTransition) {
            if (!this.isOpened) {
                this._noTransition = !!noTransition;
                this._shouldOpen = true;
                this._shouldClose = false;
                this.needsDraw = true;
            }
        }
    },

    close: {
        value: function (noTransition) {
            if (this.isOpened) {
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
                var currentCascadingListItem ;

                if (this._shouldClose) {
                    this.removeEventListener("action", this);
                    this._noTransition = false;
                    this._shouldClose = false;
                    this.isOpened = false;
                    this.cascadingList.clearShelfContent();
                    this.dispatchEventNamed("cascadingListShelfClose", true, true, this);
                    currentCascadingListItem = this.cascadingList.getCurrentCascadingListItem();
                    currentCascadingListItem.content.classList.remove('close-transition');
                    this.needsDraw = true;

                } else if (this._shouldOpen) {
                    this.addEventListener("action", this);
                    this._noTransition = false;
                    this._shouldOpen = false;
                    this.isOpened = true;
                    this.dispatchEventNamed("cascadingListShelfOpen", true, true, this);
                    currentCascadingListItem = this.cascadingList.getCurrentCascadingListItem();
                    currentCascadingListItem.content.classList.remove('open-transition');
                    this.needsDraw = true;
                }
            }
        }
    },

    willDraw: {
        value: function () {
            if (!this._anchorBoundingRect && this._shouldOpen) {
                this._cascadingListHeaderElement = this.parentComponent.element.querySelector(
                    '[data-montage-id="cascading-list-header"]'
                );

                if (this._cascadingListHeaderElement) {
                    this._anchorBoundingRect = this._cascadingListHeaderElement.getBoundingClientRect();
                    this.element.style.top = this._cascadingListHeaderElement.offsetHeight + "px";
                }
            }
        }
    },

    draw: {
        value: function () {
            var currentCascadingListItem;

            if (!this._noTransition) {
                if (this._shouldOpen) {
                    this.classList.add('open-transition');
                    currentCascadingListItem = this.cascadingList.getCurrentCascadingListItem();
                    currentCascadingListItem.content.classList.add('open-transition');

                } else {
                    this.classList.remove('open-transition');
                }

                if (this._shouldClose) {
                    this.classList.add('close-transition');
                    currentCascadingListItem = this.cascadingList.getCurrentCascadingListItem();
                    currentCascadingListItem.content.classList.add('close-transition');
                } else {
                    this.classList.remove('close-transition');
                }
            } else {
                this.classList.remove('open-transition');
                this.classList.remove('close-transition');

                if (this._shouldOpen) {
                    this._shouldOpen = false;
                    this.isOpened = true;
                    this.addEventListener("action", this);
                    currentCascadingListItem = this.cascadingList.getCurrentCascadingListItem();
                    currentCascadingListItem.content.classList.remove('close-transition');
                    this.dispatchEventNamed("cascadingListShelfOpen", true, true, this);
                    
                } else if (this._shouldClose) {
                    this.isOpened = false;
                    this._shouldClose = false;
                    currentCascadingListItem = this.cascadingList.getCurrentCascadingListItem();
                    currentCascadingListItem.content.classList.remove('open-transition');
                    this.cascadingList.clearShelfContent();
                    this.removeEventListener("action", this);
                    this.dispatchEventNamed("cascadingListShelfClose", true, true, this);
                }
            }
        }
    }

});
