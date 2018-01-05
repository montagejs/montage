/**
 * @module "ui/list-item-menu.reel"
 */
var Component = require("../component").Component,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer;

/**
 * @class ListItemMenu
 * @extends Component
 */
var ListItemMenu = exports.ListItemMenu = Component.specialize(/** @lends ListItemMenu.prototype */{

    _shouldOpenListItem: {
        value: false
    },

    _shouldCloseListItem: {
        value: false
    },

    __translateComposer: {
        value: null
    },

    _translateComposer: {
        get: function () {
            if (!this.__translateComposer) {
                this.__translateComposer = new TranslateComposer();
                this.__translateComposer.hasMomentum = false;
                this.__translateComposer.axis = "horizontal";
                this.__translateComposer.translateX = - this._dragElementRect.width;
                this.addComposer(this.__translateComposer);
            }

            return this.__translateComposer;
        }
    },

    _thresholdDirection: {
        value: 8
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime && !ListItemMenu.cssTransform) {
                if ("webkitTransform" in this._element.style) {
                    ListItemMenu.cssTransform = "webkitTransform";
                } else if ("MozTransform" in this._element.style) {
                    ListItemMenu.cssTransform = "MozTransform";
                } else if ("oTransform" in this._element.style) {
                    ListItemMenu.cssTransform = "oTransform";
                } else {
                    ListItemMenu.cssTransform = "transform";
                }
            }

            this._startListeningToTranslateIfNeeded();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._startListeningToTranslate();
        }
    },

    exitDocument: {
        value: function () {
            this._stopListeningToTranslateIfNeeded();
        }
    },


    /**
     * Plublic Apis
     */

    openLeft: {
        value: function () {
            this.open(ListItemMenu.DIRECTION.LEFT);
        }
    },

    openRight: {
        value: function () {
            this.open(ListItemMenu.DIRECTION.RIGHT);
        }
    },

    open: {
        value: function (direction) {
            if (direction === ListItemMenu.DIRECTION.RIGHT ||
                direction === ListItemMenu.DIRECTION.LEFT
            ) {
                this._direction = direction === ListItemMenu.DIRECTION.LEFT ?
                    ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT;
                this._shouldOpenListItem = true;
                this.needsDraw = true;
            }
        }
    },

    close: {
        value: function () {
            this._shouldCloseListItem = true;
            this.needsDraw = true;
        }
    },
    
    _startListeningToTranslateIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._startListeningToTranslate();
            }
        }
    },

    _startListeningToTranslate: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this, false);
        }
    },

    _stopListeningToTranslateIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._translateComposer.removeEventListener('translateStart', this, false);
            }
        }
    },

    handleTranslateStart: {
        value: function (event) {
            this._startPositionX = this.__translateComposer.translateX;
            this._isDragging = true;
            this._addDragEventListeners();
        }
    },

    handleTranslate: {
        value: function (event) {
            this._translateX = event.translateX;
            this._deltaX = this._translateX - this._startPositionX;

            if (!this._direction && Math.abs(this._deltaX) > this._thresholdDirection) {
                this._direction = this._deltaX > 0 ? ListItemMenu.DIRECTION.RIGHT : 
                    ListItemMenu.DIRECTION.LEFT;
            }

            this.needsDraw = true;
        }
    },

    handleTranslateEnd: {
        value: function () {
            this._resetTranslateContext();
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._resetTranslateContext();
        }
    },

    _addDragEventListeners: {
        value: function () {
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);
            this._translateComposer.addEventListener('translateCancel', this, false);
        }
    },

    _removeDragEventListeners: {
        value: function () {
            this._translateComposer.removeEventListener('translate', this, false);
            this._translateComposer.removeEventListener('translateEnd', this, false);
            this._translateComposer.removeEventListener('translateCancel', this, false);
        }
    },

    _resetTranslateContext: {
        value: function () {
            this._removeDragEventListeners();
            this._deltaX = 0;
            this._isDragging = false;
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            if (!this._dragElementRect) {
                this._dragElementRect = this.dragElement.getBoundingClientRect();
            }
        }
    },

    draw: {
        value: function () {
            if (this.__translateComposer) {
                var translateX = this._translateX;

                if (this._isDragging) {
                    var isLeft = this._direction === ListItemMenu.DIRECTION.LEFT;

                    this.dragElement.style.WebkitTransition = null;

                    // Hides not sliding options.
                    if (isLeft) {
                        this.rightOptionsElement.classList.remove('hide');
                        this.leftOptionsElement.classList.add('hide');
                    } else {
                        this.rightOptionsElement.classList.add('hide');
                        this.leftOptionsElement.classList.remove('hide');
                    }

                    // Blocks translating when reaching edges.
                    if (this._direction &&
                        Math.abs(this._deltaX) > this._dragElementRect.width
                    ) {
                        translateX = isLeft && this._deltaX < 0 ?
                            this._dragElementRect.width * -2 : 0;
                    }
                } else if (this._direction || this._shouldCloseListItem) {
                    if (this._shouldOpenListItem) {
                        if (this._direction === ListItemMenu.DIRECTION.LEFT) {
                            translateX = this._dragElementRect.width * -1.5;
                        } else {
                            translateX = this._dragElementRect.width * -0.5;
                        }
                    } else {
                        translateX = this.__translateComposer.translateX = - this._dragElementRect.width;
                    }

                    this.dragElement.style.WebkitTransition = 'transform .3s ease-out';
                    this._shouldCloseListItem = false;
                    this._shouldOpenListItem = false;
                    this._direction = null;
                } else {
                    translateX = this.__translateComposer.translateX = - this._dragElementRect.width;
                }

                this.dragElement.style[ListItemMenu.cssTransform] = "translate3d(" +
                    translateX + "px,0,0)";
            }
        }
    }

}, {
        DIRECTION: {
            value: {
                LEFT: 'LEFT',
                RIGHT: 'RIGHT'
            }
        }    
    }
);
