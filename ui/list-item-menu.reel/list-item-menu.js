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
                    "<-": "__isOpened"
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
        value: null
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

    __translateComposer: {
        value: null
    },

    /**
     * @private
     * @typedef {Object} TranslateComposer
     * @readOnly
     * @default null
     * @description List item menu's translate composer
     */
    _translateComposer: {
        get: function () {
            if (!this.__translateComposer) {
                this.__translateComposer = new TranslateComposer();
                this.__translateComposer.hasMomentum = false;
                this.__translateComposer.allowFloats = false;
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

    /**
     * @private
     * @typedef {Object} PressComposer
     * @readOnly
     * @default null
     * @description List item menu's press composer
     */
    _pressComposer: {
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.addComposerForElement(this.__pressComposer, document);
            }

            return this.__pressComposer;
        }
    },

    _openedSide: {
        value: null
    },

    /**
     * @public
     * @typedef {string} ListItemMenu.DIRECTION
     * @readOnly
     * @default null
     * @description Represents the current opened side.
     */
    openedSide: {
        get: function () {
            return this._openedSide;
        }
    },

    __isOpened: {
        value: false
    },

    _isOpened: {
        set: function (opened) {
            if (opened !== this._opened) {
                this.__isOpened = opened;

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
            return this.__isOpened;
        }
    },

    /**
     * @public
     * @type {boolean}
     * @default false
     * @readonly
     * @description Indicates if the list item menu is opened
     */
    isOpened: {
        get: function () {
            return this.__isOpened;
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
                    this._openedSide = side;
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
            window.addEventListener("resize", this);

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
                window.removeEventListener("resize", this);

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

    handleResize: {
        value: function () {
            this._forceComputingBoundaries = true;
            this.needsDraw = true;
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
                    this._isOpened = false;
                    this._openedSide = null;

                } else if (this._shouldOpen) {
                    this.__shouldOpen = false;
                    this._isOpened = true;
                }

                this._direction = null;
            }
        }
    },

    handlePointerenter: {
        value: function (event) {
            if (window.PointerEvent) {
                if (event.pointerType === "mouse") {
                    this.element.addEventListener('pointermove', this);
                    this.element.addEventListener('pointerleave', this);
                }
            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                if (event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_MOUSE) {
                    this.element.addEventListener('MSPointerMove', this);
                    this.element.addEventListener('MSPointerLeave', this);
                }
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
            this._startPositionX = this.__translateComposer.translateX;
            this._isTranslating = false;
            this.__shouldClose = false;
            this.__shouldOpen = false;
            this._direction = null;
            this._startTimestamp = event.timeStamp;
            this.application.addEventListener('translateEnd', this);
            this._addDragEventListeners();
        }
    },

    handleTranslate: {
        value: function (event) {
            var translateX = event.translateX,
                deltaX = translateX - this._startPositionX;

            if (!this._direction) {
                this._direction = deltaX > 2 ?
                    ListItemMenu.DIRECTION.RIGHT : deltaX < - 2 ?
                        ListItemMenu.DIRECTION.LEFT : null;
            }

            var direction = this._direction,
                distance;

            if (!direction && !this._isTranslating) {
                // wait for a "real" translate.
                return void 0;
            }

            if (!this._openedSide &&
                ((direction === ListItemMenu.DIRECTION.LEFT &&
                    (!this._rightButtons || !this._rightButtons.length)) ||
                    (direction === ListItemMenu.DIRECTION.RIGHT &&
                        (!this._leftButtons || !this._leftButtons.length)))
            ) {
                // Cancel translating if there are no options to show
                this._translateComposer._cancel();
                return void 0;
            }

            // Defines the opened side at the first "real" translate.
            if (!this._openedSide) {
                this._openedSide = direction === ListItemMenu.DIRECTION.RIGHT ?
                    ListItemMenu.DIRECTION.LEFT : ListItemMenu.DIRECTION.RIGHT;
            }

            if (this._distance === null) {
                // Define initial distance.
                if (this._openedSide === ListItemMenu.DIRECTION.LEFT) {
                    distance = (
                        this.leftOptionsElement.getBoundingClientRect().right -
                        this._hotCornersElementRect.left
                    );
                } else {
                    distance = (
                        this._hotCornersElementRect.right -
                        this.rightOptionsElement.getBoundingClientRect().left
                    );
                }
            } else {
                var deltaTranslateX = Math.abs(this._translateX) - Math.abs(translateX);
                direction = deltaTranslateX > 0 ? ListItemMenu.DIRECTION.RIGHT :
                    deltaTranslateX < 0 ? ListItemMenu.DIRECTION.LEFT : this._direction;

                if (this._openedSide === ListItemMenu.DIRECTION.RIGHT) {
                    distance = this._distance - deltaTranslateX;
                } else {
                    distance = this._distance + deltaTranslateX;
                }
            }

            if (this._openedSide === ListItemMenu.DIRECTION.LEFT) {
                // block distance if the left options reach the right side
                if (translateX > 0) {
                    distance = this._hotCornersElementRect.width;
                } else if (
                    this._hotCornersElementRect.width + translateX <= 0
                ) {
                    // Reset the distance to 0 when a list item menu
                    // is translating above it's edges.
                    distance = 0;
                }
            } else {
                // block distance if the right options reach the left side
                if (
                    translateX < - this._hotCornersElementRect.width &&
                    Math.abs(translateX) / 2 > this._hotCornersElementRect.width
                ) {
                    distance = this._hotCornersElementRect.width;
                } else if (
                    this._hotCornersElementRect.width + translateX >= 0
                ) {
                    // Reset the distance to 0 when a list item menu
                    // is translating above it's edges.
                    distance = 0;
                }
            }

            if (distance < 0) {
                distance = 0
            }

            var buttonList = this._openedSide === ListItemMenu.DIRECTION.RIGHT ?
                this._rightButtons : this._leftButtons;

            this._hasReachEnd = !!(
                buttonList &&
                buttonList.length === 1 &&
                this._hasReachMaxDistance()
            );

            this._direction = direction;
            this._translateX = translateX;
            this._deltaX = translateX - this._startPositionX;
            this._isTranslating = true;
            this._distance = distance;
            this.needsDraw = true;
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
                                this._shouldOpen = this.isOpened &&
                                    this._openedSide === ListItemMenu.DIRECTION.RIGHT ?
                                    false : true;

                            } else {
                                // should open left side if not already opened
                                this._shouldOpen = this.isOpened &&
                                    this._openedSide === ListItemMenu.DIRECTION.LEFT ?
                                    false : true;
                            }
                        } else if (hasReachMinDistance) {
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
            this._distance = null;
            this._hasReachEnd = false;
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            if (
                !this._dragElementRect ||
                this._dragElementRect.width === 0 ||
                this._forceComputingBoundaries
            ) {
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

                var hasLeftButtons = this._leftButtons && this._leftButtons.length > 0,
                    hasRightButtons = this._rightButtons && this._rightButtons.length > 0;

                this._updateButtonPositions();
                this.disabled = !hasLeftButtons && !hasRightButtons;
            }

            this._setButtonBoundaries(this._rightButtons, 'marginLeft');
            this._setButtonBoundaries(this._leftButtons, 'marginRight');
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
                    direction = this._direction, openedSide = this._openedSide,
                    buttonList = openedSide === ListItemMenu.DIRECTION.RIGHT ?
                        this._rightButtons : this._leftButtons,
                    isLeftSideOpened = this._openedSide === ListItemMenu.DIRECTION.LEFT,
                    length, translateX;

                if (this._isTranslating && !this._shouldOpen && !this._shouldClose) {
                    // logic when a user is translating the list item
                    translateX = this._translateX;
                    dragElementStyle[ListItemMenu.cssTransition] = 'none';

                    // Hide not sliding options.
                    if (isLeftSideOpened) {
                        rightOptionsElementClassList.add('hide');
                        leftOptionsElementClassList.remove('hide');
                    } else {
                        rightOptionsElementClassList.remove('hide');
                        leftOptionsElementClassList.add('hide');
                    }

                    if (isLeftSideOpened) {
                        // block translate if the left options reach the right side
                        if (translateX > 0) {
                            translateX = 0;
                        }
                    } else {
                        // block translate if the right options reach the left side
                        if (
                            translateX < -dragElementWidth &&
                            Math.abs(translateX) / 2 > dragElementWidth
                        ) {
                            translateX = dragElementWidth * -2;
                        }
                    }

                    if (buttonList && (length = buttonList.length)) {
                        this._translateButtons(
                            buttonList,
                            (Math.abs(
                                Math.abs(translateX) - dragElementWidth) / length
                            ),
                            'none',
                            isLeftSideOpened
                        );
                    }
                } else if (this._shouldOpen || this._shouldClose) {
                    if (this._shouldOpen) {
                        translateX = this.__translateComposer.translateX = (
                            dragElementWidth * (isLeftSideOpened ? -0.5 : -1.5)
                        );
                    } else if (this._shouldClose) {
                        translateX = this.__translateComposer.translateX = (
                            - dragElementWidth
                        );
                    }

                    if (buttonList && (length = buttonList.length)) {
                        this._translateButtons(
                            buttonList,
                            this._shouldClose ? 0 : dragElementWidth / 2 / length,
                            ListItemMenu.DEFAULT_TRANSITION,
                            isLeftSideOpened
                        );
                    }

                    dragElementStyle[ListItemMenu.cssTransition] = (
                        ListItemMenu.DEFAULT_TRANSITION
                    );
                } else {
                    if (!this.isOpened) {
                        rightOptionsElementClassList.remove('hide');
                        leftOptionsElementClassList.remove('hide');
                    }
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
                        this._leftButtons.length &&
                        this._overPositionX >= this._hotCornersElementRect.left &&
                        this._overPositionX <= this._hotCornersElementRect.left + threshold
                    ) {
                        this._foldSide = ListItemMenu.DIRECTION.LEFT;
                        this._shouldFoldItem = true;
                    } else if (
                        this._rightButtons.length &&
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

                if (this._forceComputingBoundaries) {
                    this._updateButtonPositions();
                    this._forceComputingBoundaries = false;
                }
            }
        }
    },

    _updateButtonPositions: {
        value: function () {
            if (this._leftButtons && this._leftButtons.length > 0) {
                this._translateButtons(this._rightButtons, 0, 'none', false);
            }

            if (this._rightButtons && this._rightButtons.length > 0) {
                this._translateButtons(this._leftButtons, 0, 'none', true);
            }
        }
    },

    _translateButtons: {
        value: function (buttonList, position, transition, isLeftSide) {
            var button, buttonStyle, translate;

            for (var i = 0, length = buttonList.length; i < length; i++) {
                button = buttonList[i];
                buttonStyle = button.style;

                if (isLeftSide) {
                    buttonStyle.zIndex = length - i;
                    translate = -((length - i - 1) * position);
                } else {
                    buttonStyle.zIndex = i;
                    translate = i * position;
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
