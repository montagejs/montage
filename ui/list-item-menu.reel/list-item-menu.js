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

    _distance: {
        value: 0
    },

    __shouldOpen: {
        value: false
    },

    __shouldClose: {
        value: false
    },

    _shouldOpen: {
        set: function (should) {
            should = !!should;

            if (should !== this.__shouldOpen) {
                this.__shouldOpen = should;
                this.__shouldClose = !should;
            }
        },
        get: function () {
            return this.__shouldOpen;
        }
    },

    _shouldClose: {
        set: function (should) {
            should = !!should;

            if (should !== this.__shouldClose) {
                this.__shouldClose = should;
                this.__shouldOpen = !should;
            }
        },
        get: function () {
            return this.__shouldClose;
        }
    },

    _direction: {
        value: null
    },

    _openedSide: {
        get: function () {
            return this._previousDirection ? 
                this._previousDirection === ListItemMenu.DIRECTION.LEFT ?
                ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT : null;
        }
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
                    this._pressComposer.load();
                    this._pressComposer.addEventListener('press', this);
                    this._pressComposer.addEventListener('pressStart', this);
                    this._previousDirection = this._direction;
                } else {
                    this._pressComposer.removeEventListener('pressStart', this);
                    this._pressComposer.removeEventListener('press', this);
                    this._pressComposer.unload();
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
            this._open(ListItemMenu.DIRECTION.LEFT);
        }
    },

    openRight: {
        value: function () {
            this._open(ListItemMenu.DIRECTION.RIGHT);
        }
    },


    close: {
        value: function () {
            this._shouldClose = true;
            this.needsDraw = true;
        }
    },

    /**
     * Private Methods
     */

    _open: {
        value: function (side) {
            if (side === ListItemMenu.DIRECTION.RIGHT ||
                side === ListItemMenu.DIRECTION.LEFT
            ) {
                this._direction = side === ListItemMenu.DIRECTION.LEFT ?
                    ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT;
                this._shouldOpen = true;
                this.needsDraw = true;
            }
        }
    },
    
    _hasReachMinDistance: {
        value: function () {
            return this._distance >= this._dragElementRect.width * 0.15;
        }
    },

    _hasReachMaxDistance: {
        value: function () {
            return this._distance >= this._dragElementRect.width * 0.85;
        }
    },


    _findVelocity: {
        value: function (deltaTime) {
            if (deltaTime > 300) {
                return 0;
            }

            return Math.sqrt(this._deltaX * this._deltaX) / deltaTime;
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
            this._translateComposer.addEventListener('translateStart', this);
        }
    },

    _stopListeningToTranslateIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._translateComposer.removeEventListener('translateStart', this);
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

            if (!this.isOpened && !this._direction) {
                this._direction = this._deltaX > 0 ?
                    ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT;
                
                if ((this._direction === ListItemMenu.DIRECTION.LEFT &&
                    (!this._rightButtons || !this._rightButtons.length)) ||
                    (this._direction === ListItemMenu.DIRECTION.RIGHT &&
                        (!this._leftButtons || !this._leftButtons.length))
                ) {
                    // cancel translate if there are no options to show
                    this._translateComposer._cancel();
                    return void 0;
                }
            }

            var dragElementWidth = this._dragElementRect.width,
                distance = this._translateX + dragElementWidth,
                direction = this._direction || this._previousDirection,
                openedSide = direction === ListItemMenu.DIRECTION.LEFT ?
                    ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT,
                listButtons = openedSide === ListItemMenu.DIRECTION.RIGHT ?
                    this._rightButtons : this._leftButtons;

            if (direction === ListItemMenu.DIRECTION.LEFT && distance > 0 ||
                direction === ListItemMenu.DIRECTION.RIGHT && distance < 0
            ) {
                distance = 0;
            }

            distance = Math.abs(distance);

            if (distance > dragElementWidth) {
                distance = dragElementWidth;
            }

            this._distance = distance;
            this._hasReachEnd = !!(
                listButtons &&
                listButtons.length === 1 &&
                this._hasReachMaxDistance()
            );
            this.needsDraw = true;
        }
    },

    handleTranslateEnd: {
        value: function (event) {
            if (this._hasReachEnd) {
                var actionEvent = document.createEvent("CustomEvent"),
                    direction = this._direction || this._previousDirection;
                
                actionEvent.initCustomEvent("action", true, true, {
                    side: direction === ListItemMenu.DIRECTION.LEFT ?
                        ListItemMenu.DIRECTION.RIGHT :
                        ListItemMenu.DIRECTION.LEFT
                });

                this.dispatchEvent(actionEvent);
                this._shouldClose = true;
            } else {
                var velocity = this._findVelocity(
                    event.timeStamp - this._startTimestamp
                );

                if (velocity > 0.15 &&
                    Math.abs(this._deltaX) > this._dragElementRect.width * 0.05
                ) {
                    if (this._deltaX > 0) { // right
                        this._shouldOpen = this._isOpened &&
                            this._openedSide === ListItemMenu.DIRECTION.RIGHT ?
                            false : true;
                    } else { // left
                        this._shouldOpen = this._isOpened &&
                            this._openedSide === ListItemMenu.DIRECTION.LEFT ?
                            false : true;
                    }
                } else if (this._hasReachMinDistance()) {
                    this._shouldOpen = true;
                }
            }

            this._resetTranslateContext();
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._resetTranslateContext();
        }
    },

    handlePressStart: {
        value: function (event) {
            var target = event.targetElement;
            
            if (this.element !== target && !this.element.contains(target)) {
                this.close();
            }
        }
    },

    handlePress: {
        value: function () {
            if (this.isOpened && !this._isDragging) {
                this.close();
            }
        }
    },

    _addDragEventListeners: {
        value: function () {
            this._translateComposer.addEventListener('translate', this);
            this._translateComposer.addEventListener('translateEnd', this);
            this._translateComposer.addEventListener('translateCancel', this);
        }
    },

    _removeDragEventListeners: {
        value: function () {
            this._translateComposer.removeEventListener('translate', this);
            this._translateComposer.removeEventListener('translateEnd', this);
            this._translateComposer.removeEventListener('translateCancel', this);
        }
    },

    _resetTranslateContext: {
        value: function () {
            this._removeDragEventListeners();
            this._startTimestamp = 0;
            this._distance = 0;
            this._isDragging = false;
            this._hasReachEnd = false;
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            if (!this._dragElementRect) {
                this._dragElementRect = this.dragElement.getBoundingClientRect();
                this._leftButtons = this.leftOptionsElement.querySelectorAll('button');
                this._rightButtons = this.rightOptionsElement.querySelectorAll('button');

                if ((this._rightButtons && this._rightButtons.length > 3) ||
                    (this._leftButtons && this._leftButtons.length > 3)
                ) {
                    throw new Error('list item menu doesn\'t support more' +
                        'than 3 buttons per side');
                }
            }

            this._setButtonBoundaries(this._rightButtons, 'marginLeft');
            this._setButtonBoundaries(this._leftButtons, 'marginRight');
        }
    },

    _setButtonBoundaries: {
        value: function (buttonList, marginSide) {
            var i, length, button, label, labelRect;

            if (buttonList && (length = buttonList.length)) {
                buttonWidth = this._dragElementRect.width / 2 / length;

                for (i = 0; i < length; i++) {
                    button = buttonList[i];

                    if ((label = button.firstElementChild)) {
                        labelRect = label.getBoundingClientRect();
                        label.style[marginSide] =
                            (buttonWidth - labelRect.width) / 2 + 'px';
                    }
                }
            }
        }
    },

    draw: {
        value: function () {
            if (this.__translateComposer) {
                var translateX = this._translateX,
                    direction = this._direction || this._previousDirection,
                    isDirectionLeft = direction === ListItemMenu.DIRECTION.LEFT,
                    buttonList, length, i, left, translate;

                if (this._isDragging) {
                    this.dragElement.style.WebkitTransition = null;

                    if (!this.isOpened) {
                        // Hides not sliding options.
                        if (isDirectionLeft) {
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
                        translateX = isDirectionLeft && this._deltaX < 0 ?
                            this._dragElementRect.width * -2 : 0;
                    }

                    if (translateX > 0) {
                        translateX = 0;
                    }

                    if (translateX < this._dragElementRect.width * -2) {
                        translateX = this._dragElementRect.width * -2;
                    }

                    buttonList = (direction || this._previousDirection) === ListItemMenu.DIRECTION.LEFT ?
                        this._rightButtons : this._leftButtons;

                    if (buttonList && buttonList.length) {
                        for (i = 0, length = buttonList.length; i < length; i++) {
                            buttonList[i].style[ListItemMenu.cssTransition] = 'none';

                            if (isDirectionLeft) {
                                buttonList[i].style.zIndex = i;
                                translate = (((Math.abs(Math.abs(translateX) -
                                    this._dragElementRect.width)) / length) * i);
                                buttonList[i].style[ListItemMenu.cssTransform] = "translate3d(" +
                                    translate + "px,0,0)";
                            } else {
                                buttonList[i].style.zIndex = length - i;
                                translate = -(((Math.abs(Math.abs(translateX) -
                                    this._dragElementRect.width)) / length) * (length - i - 1));
                                buttonList[i].style[ListItemMenu.cssTransform] = "translate3d(" +
                                    translate + "px,0,0)";
                            }
                        }
                    }
                } else if (this._direction || this._shouldClose) {
                    if (this._shouldOpen) {
                        if (isDirectionLeft) {
                            translateX = this._dragElementRect.width * -1.5;
                        } else {
                            translateX = this._dragElementRect.width * -0.5;
                        }

                        buttonList = isDirectionLeft ? this._rightButtons : this._leftButtons;

                        if (buttonList && buttonList.length) {
                            for (i = 0, length = buttonList.length; i < length; i++) {
                                buttonList[i].style[ListItemMenu.cssTransition] = ListItemMenu.DEFAULT_TRANSITION;

                                if (isDirectionLeft) {
                                    buttonList[i].style.zIndex = i;
                                    translate = (i * (this._dragElementRect.width / 2 / length));
                                    buttonList[i].style[ListItemMenu.cssTransform] = "translate3d(" +
                                        translate + "px,0,0)";
                                } else {
                                    buttonList[i].style.zIndex = length - i;
                                    translate = -((length - i - 1) * (this._dragElementRect.width / 2 / length));
                                    buttonList[i].style[ListItemMenu.cssTransform] = "translate3d(" +
                                        translate + "px,0,0)";
                                }
                            }
                        }

                        this.__translateComposer.translateX = translateX;
                        this.isOpened = true;
                    } else {
                        translateX = this.__translateComposer.translateX = - this._dragElementRect.width;
                        this.isOpened = false;
                    }

                    this.dragElement.style[ListItemMenu.cssTransition] = ListItemMenu.DEFAULT_TRANSITION;
                    this._shouldClose = false;
                    this._shouldOpen = false;
                    this._direction = null;

                } else {
                    translateX = - this._dragElementRect.width;

                    if (this.isOpened) {
                        this.dragElement.style[ListItemMenu.cssTransition] = ListItemMenu.DEFAULT_TRANSITION;
                        var sign = Math.sign(this._deltaX);

                        if ((sign < 0 || this._shouldOpen) &&
                            this._previousDirection === ListItemMenu.DIRECTION.LEFT
                        ) {
                            translateX = this._dragElementRect.width * -1.5;
                        } else if ((sign > 0 || this._shouldOpen) &&
                            this._previousDirection === ListItemMenu.DIRECTION.RIGHT
                        ) {
                            translateX = this._dragElementRect.width * -0.5;
                        } else {
                            this.isOpened = false;
                        }

                        this._shouldOpen = false;

                        if (this.isOpened) {
                            buttonList = (direction || this._previousDirection) === ListItemMenu.DIRECTION.LEFT ?
                                this._rightButtons : this._leftButtons;
                            
                            if (buttonList && buttonList.length) {
                                for (i = 0, length = buttonList.length; i < length; i++) {
                                    buttonList[i].style[ListItemMenu.cssTransition] = ListItemMenu.DEFAULT_TRANSITION;

                                    if (isDirectionLeft) {
                                        buttonList[i].style.zIndex = i;
                                        translate = (i * (this._dragElementRect.width / 2 / length));
                                        buttonList[i].style[ListItemMenu.cssTransform] = "translate3d(" +
                                            translate + "px,0,0)";
                                    } else {
                                        buttonList[i].style.zIndex = length - i;
                                        translate = -((length - i - 1) * (this._dragElementRect.width / 2 / length));
                                        buttonList[i].style[ListItemMenu.cssTransform] = "translate3d(" +
                                            translate + "px,0,0)";
                                    }
                                }
                            }
                        }
                    }

                    this.__translateComposer.translateX = translateX;
                }

                this.dragElement.style[ListItemMenu.cssTransform] = "translate3d(" +
                    translateX + "px,0,0)";
            }

            var currentDirection = (direction || this._previousDirection),
                openedSide;

            if (currentDirection) {
                openedSide = this._openedSide || currentDirection === ListItemMenu.DIRECTION.LEFT ?
                ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT;
            }
            
            if ((openedSide && this.isOpened) || this._distance > 0) {
                this.element.classList.add('is-opened');
                this.element.classList.add(openedSide.toLowerCase() + '-side');
            } else {
                this.element.classList.remove('is-opened');
                this.element.classList.remove('left-side');
                this.element.classList.remove('right-side');
            }

            if (this._hasReachEnd) {
                if (openedSide === ListItemMenu.DIRECTION.LEFT) {
                    this.leftOptionsElement.classList.add('has-reach-end');
                } else {
                    this.rightOptionsElement.classList.add('has-reach-end');
                }
            } else {
                this.leftOptionsElement.classList.remove('has-reach-end');
                this.rightOptionsElement.classList.remove('has-reach-end');
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
            value: 'transform .3s cubic-bezier(0, 0, 0.58, 1)'
        }
    }
);
