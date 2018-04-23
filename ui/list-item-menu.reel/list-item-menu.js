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

    constructor: {
        value: function () {
            this.defineBindings({
                "classList.has('montage--disabled')": {
                    "<-": "disabled"
                },
                "classList.has('is-opened')": {
                    "<-": "isOpened"
                },
                "classList.has('is-translating')": {
                    "<-": "_isTranslating"
                },
                "classList.has('has-options-left')": {
                    "<-": "_leftButtons.defined() && _leftButtons.length > 0"
                },
                "classList.has('has-options-right')": {
                    "<-": "_rightButtons.defined() && _rightButtons.length > 0"
                },
                "_deleteLabel": {
                    "<-": "data.defined() && userInterfaceDescriptor.defined() ? " +
                        "(data.path(userInterfaceDescriptor.listItemMenuDeleteNameExpression || \"''\") || " +
                        "path(userInterfaceDescriptor.listItemMenuDeleteNameExpression || \"''\") || deleteLabel)" +
                        " : deleteLabel"
                }
            });
        }
    },

    _data: {
        value: null
    },

    /**
     * @public
     * @type {Object}
     * @default null
     * @description Represents the list item menu data
     */
    data: {
        get: function () {
            return this._data;
        },
        set: function (data) {
            if (this._data !== data) {
                this._data = data;
                this._loadDataUserInterfaceDescriptorIfNeeded();
            }
        }
    },

    /**
     * @public
     * @typedef {Object} List
     * @default null
     * @description Represents the list item menu
     * parent's list component
     */
    list: {
        value: null
    },

    /**
     * @public
     * @type {boolean}
     * @default false
     * @description Indicates if the list item menu is selected
     */
    selected: {
        value: false
    },

    /**
     * @public
     * @type {Number}
     * @default -1
     * @description Represents the list item menu position within 
     * its parent's list component
     */
    rowIndex: {
        value: -1
    },

    /**
     * @public
     * @typedef {Object} UserInterfaceDescriptor
     * @default null
     * @description Represents the list item menu
     * user interface descriptor
     */
    userInterfaceDescriptor: {
        value: null
    },

    /**
     * @public
     * @type {string}
     * @default 'Button'
     * @description Default value for the label of delete button.
     */
    deleteLabel: {
        value: null
    },

    /**
     * @private
     * @type {boolean}
     * @default false
     * @description Indicates if the list item is currently slidding
     */
    _isTranslating: {
        value: false
    },

    /**
     * @private
     * @type {Number}
     * @default 0
     * @description Represents the distance traveled by the list item 
     * from the start position.
     */
    _distance: {
        value: 0
    },

    __shouldOpen: {
        value: false
    },

    __shouldClose: {
        value: false
    },

    /**
     * @private
     * @type {boolean}
     * @default false
     * @description Indicates if the list item menu should open itself
     */
    _shouldOpen: {
        set: function (should) {
            should = !!should;
            this.__shouldOpen = should;
            this.__shouldClose = !should;
        },
        get: function () {
            return this.__shouldOpen;
        }
    },

    /**
     * @private
     * @type {boolean}
     * @default false
     * @description Indicates if the list item menu should close itself
     */
    _shouldClose: {
        set: function (should) {
            should = !!should;
            this.__shouldClose = should;
            this.__shouldOpen = !should;
        },
        get: function () {
            return this.__shouldClose;
        }
    },

    /**
     * @private
     * @typedef {string} ListItemMenu.DIRECTION
     * @default null
     * @description Represents the current translating direction
     */
    _direction: {
        value: null
    },

    /**
     * @private
     * @typedef {string} ListItemMenu.DIRECTION
     * @default null
     * @description Represents the current opened side.
     */
    _openedSide: {
        value: null
    },

    _isOpened: {
        value: false
    },

    /**
     * @private
     * @type {boolean}
     * @default false
     * @description Indicates if the list item menu is opened
     */
    isOpened: {
        set: function (opened) {
            if (opened !== this._opened) {
                this._isOpened = opened;

                if (opened) {
                    this.application.addEventListener('press', this);
                    this._pressComposer.addEventListener('pressStart', this);
                    this._pressComposer.load();
                } else {
                    this.application.removeEventListener('press', this);
                    this.application.removeEventListener('translateEnd', this);
                    this._pressComposer.removeEventListener('pressStart', this);
                    this._pressComposer.unload();
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

            this._startListeningToInitialInteractionsIfNeeded();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._startListeningToInitialInteractions();
        }
    },

    exitDocument: {
        value: function () {
            this._stopListeningToInitialInteractions();
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
            if (this.isOpened) {
                this._shouldClose = true;
                this.needsDraw = true;
            }
        }
    },

    _open: {
        value: function (side) {
            if (!this.isOpened) {
                if (side === ListItemMenu.DIRECTION.RIGHT ||
                    side === ListItemMenu.DIRECTION.LEFT
                ) {
                    this._direction = side === ListItemMenu.DIRECTION.LEFT ?
                        ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT;
                    this._shouldOpen = true;
                    this.needsDraw = true;
                }
            }
        }
    },

    _loadDataUserInterfaceDescriptorIfNeeded: {
        value: function () {
            if (this.data && this._templateDidLoad) {
                var self = this,
                    infoDelegate;

                return this.loadUserInterfaceDescriptor(this.data).then(function (UIDescriptor) {
                    self.userInterfaceDescriptor = UIDescriptor || self.userInterfaceDescriptor; // trigger biddings.

                    self._deleteLabel = self.callDelegateMethod(
                        "listItemMenuWillUseDeleteLabelForObjectAtRowIndex",
                        self,
                        self._deleteLabel,
                        self.data,
                        self.rowIndex,
                        self.list
                    ) || self._deleteLabel; // defined by a bidding expression
                });
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

    _startListeningToInitialInteractionsIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._startListeningToInitialInteractions();
            }
        }
    },

    _startListeningToInitialInteractions: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this);
            this.element.addEventListener("transitionend", this);

            if (window.PointerEvent) {
                this.element.addEventListener('pointerenter', this);
            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._element.removeEventListener("MSPointerEnter", this);
            } else {
                this.element.addEventListener('mouseenter', this);
            }
        }
    },

    _stopListeningToInitialInteractions: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._translateComposer.removeEventListener('translateStart', this);
                this.element.removeEventListener("transitionend", this);

                if (window.PointerEvent) {
                    this.element.removeEventListener('pointerenter', this);
                } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                    this._element.removeEventListener("MSPointerEnter", this);
                } else {
                    this.element.removeEventListener('mouseenter', this);
                }
            }
        }
    },

    handleTransitionend: {
        value: function (event) {
            if (event.target === this.dragElement) {
                if (this._isTranslating) {
                    this._isTranslating = false;
                }

                if (this._shouldClose) {
                    this.__shouldClose = false;
                    this.isOpened = false;
                    this._openedSide = null;

                } else if (this._shouldOpen) {
                    this.__shouldOpen = false;
                    this.isOpened = true;
                    this._openedSide = this._direction === ListItemMenu.DIRECTION.LEFT ?
                        ListItemMenu.DIRECTION.RIGHT : ListItemMenu.DIRECTION.LEFT;
                }

                this._direction = null;
            }
        }
    },

    handlePointerenter: {
        value: function (event) {
            if (window.PointerEvent) {
                this.element.addEventListener('pointermove', this);
                this.element.addEventListener('pointerleave', this);
            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this.element.addEventListener('MSPointerMove', this);
                this.element.addEventListener('MSPointerLeave', this);
            } else {
                this.element.addEventListener('mousemove', this);
                this.element.addEventListener('mouseleave', this);
            }

            this._handlePointerOver(event);
        }
    },

    _handlePointerOver: {
        value: function (event) {
            if (!this.isOpened && !this._isTranslating) {
                this._overPositionX = event.clientX;
                this.needsDraw = true;
            } else {
                this._overPositionX = null;
                this._shouldFoldItem = false;
                this.needsDraw = true;
            }
        }
    },

    handlePointerleave: {
        value: function () {
            if (window.PointerEvent) {
                this.element.removeEventListener('pointermove', this);
                this.element.removeEventListener('pointerleave', this);
            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this.element.removeEventListener('MSPointerMove', this);
                this.element.removeEventListener('MSPointerLeave', this);
            } else {
                this.element.removeEventListener('mousemove', this);
                this.element.removeEventListener('mouseleave', this);
            }

            if (!this.isOpened && !this._isTranslating &&
                this._shouldFoldItem !== false
            ) {
                this._shouldFoldItem = false;
                this._shouldUnfoldItem = true;
                this.needsDraw = true;
            }
            this._overPositionX = null;
        }
    },

    handleTranslateStart: {
        value: function (event) {
            this.application.addEventListener('translateEnd', this);
            this._startPositionX = this.__translateComposer.translateX;
            this._isTranslating = false;
            this.__shouldClose = false;
            this.__shouldOpen = false;
            this._direction = null;
            this._startTimestamp = event.timeStamp;
            this._addDragEventListeners();
        }
    },

    handleTranslate: {
        value: function (event) {
            this._translateX = event.translateX;
            this._deltaX = this._translateX - this._startPositionX;

            if (!this._direction) {
                this._direction = this._deltaX > 2 ?
                    ListItemMenu.DIRECTION.RIGHT : this._deltaX < - 2 ?
                        ListItemMenu.DIRECTION.LEFT : null;

                if (!this.isOpened &&
                    ((this._direction === ListItemMenu.DIRECTION.LEFT &&
                        (!this._rightButtons || !this._rightButtons.length)) ||
                        (this._direction === ListItemMenu.DIRECTION.RIGHT &&
                            (!this._leftButtons || !this._leftButtons.length)))
                ) {
                    // cancel translate if there are no options to show
                    this._translateComposer._cancel();
                    return void 0;
                }
            }

            var direction = this._direction;

            if (direction) {
                this._isTranslating = true;

                var dragElementWidth = this._dragElementRect.width,
                    distance = this._translateX + dragElementWidth,
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
        }
    },

    handleTranslateEnd: {
        value: function (event) {
            var target = event.targetElement || event.target;

            if (target === this.element || this.element.contains(target)) {
                var direction = this._direction;

                if (direction) {
                    if (this._hasReachEnd) {
                        // Dispatches an action event and close the list item menu
                        // when a user reached the maximum distance
                        var actionEvent = document.createEvent("CustomEvent");

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
                        ),
                            hasReachMinDistance = this._hasReachMinDistance();

                        if (hasReachMinDistance && velocity > 0.15 &&
                            Math.abs(this._deltaX) > this._dragElementRect.width * 0.05
                        ) { // should open a side if we detect a good swipe

                            if (this._deltaX > 0) {
                                // should open right side if not already opened
                                this._shouldOpen = this._isOpened &&
                                    this._openedSide === ListItemMenu.DIRECTION.RIGHT ?
                                    false : true;

                            } else {
                                // should open left side if not already opened
                                this._shouldOpen = this._isOpened &&
                                    this._openedSide === ListItemMenu.DIRECTION.LEFT ?
                                    false : true;
                            }
                        } else if (hasReachMinDistance && !this._isOpened) {
                            // should open a side if the minimum distance has been reached.
                            this._shouldOpen = true;
                        } else {
                            // should close a side if the minimum distance has not been reached.
                            this._shouldClose = true;
                        }
                    }
                }

                this._resetTranslateContext();
            } else {
                this._closeIfNeeded();
            }
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._resetTranslateContext();
            this._isTranslating = false;
            this._direction = null;
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
            this._closeIfNeeded();
        }
    },

    _closeIfNeeded: {
        value: function () {
            if (this.isOpened && !this._isTranslating) {
                this.close();
            }
        }
    },

    _addDragEventListeners: {
        value: function () {
            this._translateComposer.addEventListener('translate', this);
            this._translateComposer.addEventListener('translateCancel', this);
        }
    },

    _removeDragEventListeners: {
        value: function () {
            this._translateComposer.removeEventListener('translate', this);
            this._translateComposer.removeEventListener('translateCancel', this);
        }
    },

    _resetTranslateContext: {
        value: function () {
            this._removeDragEventListeners();
            this._startTimestamp = 0;
            this._distance = 0;
            this._hasReachEnd = false;
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            if (!this._dragElementRect || this._dragElementRect.width === 0) {
                this._dragElementRect = this.dragElement.getBoundingClientRect();
                this._hotCornersElementRect = this.hotCornersElement.getBoundingClientRect();
                this._leftButtons = this.leftOptionsElement.querySelectorAll('button');
                this._rightButtons = this.rightOptionsElement.querySelectorAll('button');

                if ((this._rightButtons && this._rightButtons.length > 3) ||
                    (this._leftButtons && this._leftButtons.length > 3)
                ) {
                    throw new Error(
                        'the list item menu component doesn\'t support' +
                        'more than 3 buttons per slidding side'
                    );
                }

                this.disabled = this._rightButtons && !this._rightButtons.length &&
                    this._leftButtons && !this._leftButtons.length;
            }

            this._setButtonBoundaries(this._rightButtons, 'marginLeft');
            this._setButtonBoundaries(this._leftButtons, 'marginRight');
        }
    },

    _setButtonBoundaries: {
        value: function (buttonList, marginSide) {
            var i, length, button, label, labelRect, buttonWidth;

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
            if (this.__translateComposer && !this.disabled) {
                var dragElementWidth = this._dragElementRect.width,
                    dragElementStyle = this.dragElement.style,
                    elementClassList = this.element.classList,
                    leftOptionsElementClassList = this.leftOptionsElement.classList,
                    rightOptionsElementClassList = this.rightOptionsElement.classList,
                    direction = this._direction,
                    isDirectionLeft = direction === ListItemMenu.DIRECTION.LEFT,
                    buttonList = isDirectionLeft ?
                        this._rightButtons : this._leftButtons,
                    length, translateX;

                if (this._isTranslating && !this._shouldOpen && !this._shouldClose) {
                    // logic when a user is translating the list item
                    translateX = this._translateX;
                    dragElementStyle[ListItemMenu.cssTransition] = 'none';

                    if (!this.isOpened) {
                        // Hide not sliding options.
                        if (isDirectionLeft) {
                            rightOptionsElementClassList.remove('hide');
                            leftOptionsElementClassList.add('hide');
                        } else {
                            rightOptionsElementClassList.add('hide');
                            leftOptionsElementClassList.remove('hide');
                        }
                    }

                    // Block any translation when we reach the edges of a side.
                    if (this._direction &&
                        Math.abs(
                            !this.isOpened ? this._deltaX : this._deltaX / 2
                        ) > dragElementWidth
                    ) {
                        translateX = isDirectionLeft && this._deltaX < 0 ?
                            dragElementWidth * -2 : 0;
                    }

                    if (translateX > 0) {
                        translateX = 0;
                    }

                    if (translateX < dragElementWidth * -2) {
                        translateX = dragElementWidth * -2;
                    }

                    if (buttonList && (length = buttonList.length)) {
                        this._translateButtons(
                            buttonList,
                            (Math.abs(
                                Math.abs(translateX) - dragElementWidth) / length
                            ),
                            'none',
                            isDirectionLeft
                        );
                    }
                } else if (this._shouldOpen || this._shouldClose) {
                    if (this._shouldOpen) {
                        translateX = this.__translateComposer.translateX = (
                            dragElementWidth * (isDirectionLeft ? -1.5 : -0.5)
                        );
                    } else if (this._shouldClose) {
                        translateX = this.__translateComposer.translateX = (
                            - dragElementWidth
                        );
                    }

                    if (buttonList && (length = buttonList.length)) {
                        this._translateButtons(
                            buttonList,
                            dragElementWidth / 2 / length,
                            ListItemMenu.DEFAULT_TRANSITION,
                            isDirectionLeft
                        );
                    }

                    dragElementStyle[ListItemMenu.cssTransition] = (
                        ListItemMenu.DEFAULT_TRANSITION
                    );
                }

                if (translateX !== void 0) {
                    dragElementStyle[ListItemMenu.cssTransform] = (
                        "translate3d(" + translateX + "px,0,0)"
                    );
                }

                if (this._openedSide) {
                    elementClassList.add(this._openedSide.toLowerCase() + '-side');
                } else {
                    elementClassList.remove('left-side');
                    elementClassList.remove('right-side');
                }

                if (this._hasReachEnd) {
                    if (this._openedSide === ListItemMenu.DIRECTION.LEFT) {
                        leftOptionsElementClassList.add('has-reach-end');
                    } else {
                        rightOptionsElementClassList.add('has-reach-end');
                    }
                } else {
                    leftOptionsElementClassList.remove('has-reach-end');
                    rightOptionsElementClassList.remove('has-reach-end');
                }

                if (this._overPositionX !== null) {
                    var threshold = dragElementWidth * 0.25;

                    if (
                        this._overPositionX >= this._hotCornersElementRect.left &&
                        this._overPositionX <= this._hotCornersElementRect.left + threshold
                    ) {
                        this._foldSide = ListItemMenu.DIRECTION.LEFT;
                        this._shouldFoldItem = true;
                    } else if (
                        this._overPositionX >= this._hotCornersElementRect.right - threshold &&
                        this._overPositionX <= this._hotCornersElementRect.right
                    ) {
                        this._shouldFoldItem = true;
                        this._foldSide = ListItemMenu.DIRECTION.RIGHT;
                    } else {
                        if (this._shouldFoldItem) {
                            this._shouldUnfoldItem = true;
                        }

                        this._shouldFoldItem = false;
                    }
                }

                if (this._shouldFoldItem) {
                    elementClassList.add('fold-' + this._foldSide.toLowerCase());
                    elementClassList.remove('unfold-right');
                    elementClassList.remove('unfold-left');
                } else {
                    elementClassList.remove('fold-right');
                    elementClassList.remove('fold-left');
                }

                if (this._shouldUnfoldItem && this._foldSide) {
                    elementClassList.add('unfold-' + this._foldSide.toLowerCase());
                    this._shouldUnfoldItem = false;
                    this._foldSide = null;
                }
            }
        }
    },

    _translateButtons: {
        value: function (buttonList, initialPosition, transition, isDirectionLeft) {
            var button, buttonStyle, translate;

            for (var i = 0, length = buttonList.length; i < length; i++) {
                button = buttonList[i];
                buttonStyle = button.style;

                if (isDirectionLeft) {
                    buttonStyle.zIndex = i;
                    translate = i * initialPosition;

                } else {
                    buttonStyle.zIndex = length - i;
                    translate = -((length - i - 1) * initialPosition);
                }

                buttonStyle[ListItemMenu.cssTransition] = transition;
                buttonStyle[ListItemMenu.cssTransform] = (
                    "translate3d(" + translate + "px,0,0)"
                );
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

ListItemMenu.prototype.handlePointermove = ListItemMenu.prototype._handlePointerOver;
ListItemMenu.prototype.handleMSPointerEnter = ListItemMenu.prototype.handlePointerenter;
ListItemMenu.prototype.handleMSPointerMove = ListItemMenu.prototype._handlePointerOver;
ListItemMenu.prototype.handleMSPointerLeave = ListItemMenu.prototype.handlePointerleave;
ListItemMenu.prototype.handleMouseenter = ListItemMenu.prototype.handlePointerenter;
ListItemMenu.prototype.handleMousemove = ListItemMenu.prototype._handlePointerOver;
ListItemMenu.prototype.handleMouseleave = ListItemMenu.prototype.handlePointerleave;
