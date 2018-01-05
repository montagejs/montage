/**
 * @module "ui/list-item-menu.reel"
 */
var Component = require("../component").Component,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    PressComposer = require("../../composer/press-composer").PressComposer;

/**
 * @class ListItemMenu
 * @extends Component
 */
var ListItemMenu = exports.ListItemMenu = Component.specialize(/** @lends ListItemMenu.prototype */{

    _minDistance: {
        value: 0
    },

    _shouldOpenListItem: {
        value: false
    },

    _shouldCloseListItem: {
        value: false
    },

    _previousDirection: {
        value: null
    },

    _isOpened: {
        value: false
    },

    isOpened: {
        set: function (opened) {
            if (opened !== this._opened) {
                this._isOpened = opened;

                if (opened) {
                    this._pressComposer.addEventListener('press', this, false);
                    this._previousDirection = this._direction;
                } else {
                    this._pressComposer.removeEventListener('press', this, false);
                    this._previousDirection = null; 
                }
            }
        },
        get: function () {
            return this._isOpened;
        }
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

    __pressComposer: {
        value: null
    },

    _pressComposer: {
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.addComposerForElement(this.__pressComposer, document);
            }

            return this.__pressComposer;
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
                    ListItemMenu.cssTransition = "webkitTransition";
                } else if ("MozTransform" in this._element.style) {
                    ListItemMenu.cssTransform = "MozTransform";
                    ListItemMenu.cssTransition = "MozTransition";
                } else if ("oTransform" in this._element.style) {
                    ListItemMenu.cssTransform = "oTransform";
                    ListItemMenu.cssTransition = "oTransition";
                } else {
                    ListItemMenu.cssTransform = "transform";
                    ListItemMenu.cssTransition = "transition";
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


    /**
     * Private Methods
     */

    
    _hasReachMinDistance: {
        value: function () {
            return this._minDistance >= this._dragElementRect.width * 0.1;
        }
    },

    _findVelocity: {
        enumerable: false,
        value: function (deltaTime) {
            if (deltaTime > 300) {
                return 0;
            }

            return (Math.sqrt((this._deltaX * this._deltaX)) / deltaTime);
        }
    },


     /**
     * Event Listeners
     */

    
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
            this._startTimestamp = event.timeStamp;
            this._addDragEventListeners();
        }
    },

    handleTranslate: {
        value: function (event) {
            this._translateX = event.translateX;
            this._deltaX = this._translateX - this._startPositionX;

            var distance = Math.abs(this._deltaX);

            if (!this.isOpened && !this._direction) {
                this._direction = this._deltaX > 0 ? ListItemMenu.DIRECTION.RIGHT : 
                    ListItemMenu.DIRECTION.LEFT;
            }

            if (distance > this._minDistance) {
                this._minDistance = distance;
            }

            this.needsDraw = true;
        }
    },

    handleTranslateEnd: {
        value: function (event) {
            var velocity = this._findVelocity(event.timeStamp - this._startTimestamp);

            if (!this._shouldOpenListItem && this._direction && ((velocity > 0.15 &&
                Math.abs(this._deltaX) > this._dragElementRect.width * 0.05) || 
                (this._hasReachMinDistance()))
            ) { /* swipe detected or min distance reached */
                this._shouldOpenListItem = true;
            }

            this._resetTranslateContext();
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._resetTranslateContext();
        }
    },

    handlePress: {
        value: function () {
            if (this.isOpened && !this._isDragging && !this._hasReachMinDistance()) {
                this.close();
            }
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
            this._startTimestamp = 0;
            this._minDistance = 0;
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

                    if (!this.isOpened) {
                        // Hides not sliding options.
                        if (isLeft) {
                            this.rightOptionsElement.classList.remove('hide');
                            this.leftOptionsElement.classList.add('hide');
                        } else {
                            this.rightOptionsElement.classList.add('hide');
                            this.leftOptionsElement.classList.remove('hide');
                        }
                    }

                    // Blocks translating when reaching edges.
                    if (this._direction &&
                        Math.abs(this._deltaX) > this._dragElementRect.width
                    ) {
                        translateX = isLeft && this._deltaX < 0 ?
                            this._dragElementRect.width * -2 : 0;
                    }

                    if (translateX > 0) {
                        translateX = 0;
                    }

                    if (translateX < this._dragElementRect.width * -2) {
                        translateX = this._dragElementRect.width * -2;
                    }
                } else if (this._direction || this._shouldCloseListItem) {
                    if (this._shouldOpenListItem) {
                        if (this._direction === ListItemMenu.DIRECTION.LEFT) {
                            translateX = this._dragElementRect.width * -1.5;
                        } else {
                            translateX = this._dragElementRect.width * -0.5;
                        }

                        this.__translateComposer.translateX = translateX;
                        this.isOpened = true;
                    } else {
                        translateX = this.__translateComposer.translateX = - this._dragElementRect.width;
                        this.isOpened = false;
                    }

                    this.dragElement.style[ListItemMenu.cssTransition] = ListItemMenu.DEFAULT_TRANSITION;
                    this._shouldCloseListItem = false;
                    this._shouldOpenListItem = false;
                    this._direction = null;
                } else {
                    translateX = - this._dragElementRect.width;

                    if (this.isOpened) {
                        this.dragElement.style[ListItemMenu.cssTransition] = ListItemMenu.DEFAULT_TRANSITION;

                        var sign = Math.sign(this._deltaX);

                        if (sign < 0 &&
                            this._previousDirection === ListItemMenu.DIRECTION.LEFT
                        ) {
                            translateX = this._dragElementRect.width * -1.5;

                        } else if (sign > 0 &&
                            this._previousDirection === ListItemMenu.DIRECTION.RIGHT
                        ) {
                            translateX = this._dragElementRect.width * -0.5;
                        }
                    }

                    this.__translateComposer.translateX = translateX;
                    this.isOpened = false;
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
        },
        
        DEFAULT_TRANSITION: {
            value: 'transform .3s ease-out'
        }
    }
);
