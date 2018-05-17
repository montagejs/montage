var TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    CascadingListItem = require("./cascading-list-item.reel").CascadingListItem,
    PressComposer = require("../../composer/press-composer").PressComposer,
    ListItem = require("../list-item.reel").ListItem,
    Promise = require('../../core/promise').Promise,
    Component = require("../component").Component,
    Montage = require("../../core/core").Montage;


var CascadingListContext = exports.CascadingListContext = Montage.specialize({

    object: {
        value: null
    },

    userInterfaceDescriptor: {
        value: null
    },

    columnIndex: {
        value: null
    },

    cascadingList: {
        value: null
    },

    cascadingListItem: {
        value: null
    },

    isEditing: {
        value: false
    }

});

var CascadingList = exports.CascadingList = Component.specialize({

    __pressComposer: {
        value: null
    },

    _pressComposer: {
        get: function () {
            if (!this.__pressComposer) {
                this.__pressComposer = new PressComposer();
                this.__pressComposer.delegate = this;

                this.addComposerForElement(
                    this.__pressComposer,
                    this.element.ownerDocument
                );
            }

            return this.__pressComposer;
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
                this.__translateComposer.shouldCancelOnSroll = false;
                this.__translateComposer.translateX = 0;
                this.__translateComposer.translateY = 0;
                this.addComposer(this.__translateComposer);
            }

            return this.__translateComposer;
        }
    },

    _currentColumnIndex: {
        value: 0
    },

    currentColumnIndex: {
        get: function () {
            return this._currentColumnIndex;
        }
    },

    history: {
        get: function () {
            return this.succession ?
                this.succession.history : [];
        }
    },

    isFlat: {
        value: false
    },

    isResponsive: {
        value: true
    },

    shrinkForWidth: {
        value: 768 // px
    },

    _contentBuildOutAnimation: {
        value: {
            cssClass: "buildOut",
            toCssClass: "buildOutTo"
        }
    },

    _contentBuildInAnimation: {
        value: {
            fromCssClass: "buildInFrom",
            cssClass: "buildIn"
        }
    },

    _root: {
        value: null
    },

    root: {
        get: function () {
            return this._root;
        },
        set: function (root) {
            if (this._root !== root) {
                this._root = root;

                if (root && !this.isDeserializing) {
                    this.expand(root);
                }
            }
        }
    },

    shouldDispatchCascadingListEvents: {
        value: false
    },

    isShelfOpened: {
        value: false
    },

    _shelfContent: {
        value: null
    },

    shelfContent: {
        get: function () {
            return this._shelfContent || (this._shelfContent = []);
        }
    },

    enterDocument: {
        value: function () {
            if (!CascadingList.cssTransform) {
                if ("webkitTransform" in this._element.style) {
                    CascadingList.cssTransform = "webkitTransform";
                } else if ("MozTransform" in this._element.style) {
                    CascadingList.cssTransform = "MozTransform";
                } else if ("oTransform" in this._element.style) {
                    CascadingList.cssTransform = "oTransform";
                } else {
                    CascadingList.cssTransform = "transform";
                }
            }

            window.addEventListener("resize", this);
            this.addEventListener("cascadingListItemLoaded", this);
            this.addEventListener("cascadingListShelfOpen", this);
            this.addEventListener("cascadingListShelfClose", this);
            this.addEventListener("listIterationLongPress", this);

            if (this._root) {
                this.expand(this._root);
            }
        }
    },

    exitDocument: {
        value: function () {
            window.removeEventListener("resize", this);
            this.removeEventListener("cascadingListItemLoaded", this);
            this.removeEventListener("cascadingListShelfOpen", this);
            this.removeEventListener("cascadingListShelfClose", this);
            this.removeEventListener("listIterationLongPress", this);

            this.classList.remove('animated');

            this.popAll();
        }
    },

    _delegate: {
        value: null
    },

    delegate: {
        set: function (delegate) {
            this._delegate = delegate;

            if (delegate) {
                if (delegate.shouldListEnableSelection === void 0) {
                    delegate.shouldListEnableSelection =
                        this.shouldListEnableSelection.bind(delegate);
                }

                if (delegate.shouldListBeExpandable === void 0) {
                    delegate.shouldListBeExpandable =
                        this.shouldListBeExpandable.bind(delegate);
                }

                if (delegate.shouldListAllowMultipleSelectionn === void 0) {
                    delegate.shouldListAllowMultipleSelectionn =
                        this.shouldListAllowMultipleSelectionn.bind(delegate);
                }
            }
        },
        get: function () {
            return this._delegate || this;
        }
    },

    shouldListEnableSelection: {
        value: function () {
            return true;
        }
    },

    shouldListBeExpandable: {
        value: function () {
            return true;
        }
    },

    shouldListAllowMultipleSelectionn: {
        value: function () {
            return false;
        }
    },

    push: {
        value: function (object) {
            this.expand(object, this._currentColumnIndex + 1);
        }
    },

    pop: {
        value: function () {
            this._pop();
        }
    },

    popAll: {
        value: function () {
            while (this.history.length) {
                this._pop();
            }
        }
    },

    popAtIndex: {
        value: function (index) {
            if (index <= this._currentColumnIndex && this._currentColumnIndex !== -1) {
                this._pop();

                // the value of the property _currentColumnIndex 
                // changed when _pop() has been called.
                if (index <= this._currentColumnIndex) {
                    this.popAtIndex(index);
                }
            }
        }
    },

    expand: {
        value: function (object, columnIndex, isEditing) {
            columnIndex = columnIndex || this._currentColumnIndex;

            if (columnIndex) {
                if (columnIndex > 0) {
                    var parentCascadingListItem = this.cascadingListItemAtIndex(columnIndex - 1);

                    if (parentCascadingListItem) {
                        parentCascadingListItem.selectObject(object);
                    }
                }

                for (var i = this.history.length - columnIndex; i > 0; i--) {
                    this._pop();
                }
            } else {
                this.popAll();
            }

            this._currentColumnIndex = columnIndex;

            this._closeShelfIfNeeded();

            return this._populateColumnWithObjectAndIndex(
                object, columnIndex, isEditing
            );
        }
    },

    cascadingListItemAtIndex: {
        value: function (index) {
            if (this.history[index]) {
                return this.history[index];
            }
        }
    },

    getCurrentCascadingListItem: {
        value: function (index) {
            return this.cascadingListItemAtIndex(this._currentColumnIndex);
        }
    },

    findIndexForObject: {
        value: function (object) {
            for (var i = this.history.length - 1; i > -1; i--) {
                if (this.history[i].context === object) {
                    return i;
                }
            }

            return -1;
        }
    },

    openShelf: {
        value: function (noTransition) {
            if (!this.shelf.isOpened && !this.isFlat) {
                this.shelf.open(noTransition);
            }
        }
    },

    closeShelf: {
        value: function (noTransition) {
            if (this.shelf.isOpened && !this.isFlat) {
                this.shelf.close(noTransition);
            }
        }
    },

    removeObjectFromShelf: {
        value: function (object) {
            var index;

            if ((index = this.shelfContent.indexOf(object)) !== -1) {
                this.shelfContent.splice(index, 1);
            }
        }
    },

    addObjectToShelf: {
        value: function (object) {
            if (this.shelfContent.indexOf(object) === -1) {
                this.shelfContent.push(object);
            }
        }
    },

    clearShelfContent: {
        value: function () {
            this.shelfContent.clear();
        }
    },

    /**
     * Event Handlers
     */

    handlePress: {
        value: function (event) {
            if (!this.element.contains(event.targetElement)) {
                this.closeShelf();
            }
        }
    },

    handleListIterationLongPress: {
        value: function (event) {
            if (!this.isFlat) {
                this.openShelf();
            }
        }
    },

    handleTranslateStart: {
        value: function (event) {
            var startPosition = this._translateComposer.pointerStartEventPosition,
                dataObject = this._findDataObjectFromElement(startPosition.target);

            if (dataObject) {
                var delegateResponse = this.callDelegateMethod(
                    'cascadingListCanDragObject', this, dataObject, true
                ),
                    canDrag = delegateResponse === void 0 ? true : delegateResponse;

                if (canDrag) {
                    this._startPositionX = startPosition.pageX;
                    this._startPositionY = startPosition.pageY;
                    // Add delegate method
                    this._draggingListItem = this._findListItemFromElement(startPosition.target);
                    this._draggingDataObject = dataObject;
                    this._isDragging = true;

                    this._addDragEventListeners();
                }
            }
        }
    },

    handleTranslate: {
        value: function (event) {
            this._translateX = event.translateX;
            this._translateY = event.translateY;
            this._isItemDragOverShelf = this._isListItemOverShelf();
            this.needsDraw = true;
        }
    },

    handleTranslateEnd: {
        value: function () {
            if (this._isItemDragOverShelf) {
                this.addObjectToShelf(this._draggingDataObject);
            }

            this._resetTranslateContext();
        }
    },

    handleCascadingListShelfOpen: {
        value: function (event) {
            this.isShelfOpened = true;
            this._pressComposer.addEventListener("press", this);
            this._translateComposer.addEventListener("translateStart", this);
        }
    },

    handleCascadingListShelfClose: {
        value: function (event) {
            this.isShelfOpened = false;
            this._pressComposer.removeEventListener("press", this);
            this._translateComposer.removeEventListener("translateStart", this);
        }
    },

    handleBackAction: {
        value: function () {
            this._pop();
            this._closeShelfIfNeeded();
            this._isBackTransition = true;
        }
    },

    handleBuildOutEnd: {
        value: function (event) {
            this._isBackTransition = false;
        }
    },

    handleCascadingListItemLoaded: {
        value: function () {
            this.classList.add('animated');
            this.removeEventListener('cascadingListItemLoaded', this);
        }
    },

    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

     /**
     * Private Method
     */

    _closeShelfIfNeeded: {
        value: function () {
            if (this.shelf.isOpened && !this.shelfContent.length) {
                this.closeShelf(true);
            }
        }
    },
    
    _push: {
        value: function (context) {
            var cascadingListItem = new CascadingListItem();
            cascadingListItem.element = document.createElement("div");
            cascadingListItem.cascadingList = this;
            cascadingListItem.delegate = this.delegate;
            cascadingListItem.context = context;
            cascadingListItem.isFlat = this.isFlat;
            cascadingListItem.needsDraw = true;
            this.history.splice(context.columnIndex, 1, cascadingListItem);

            if (this.shouldDispatchCascadingListEvents) {
                this.dispatchEventNamed(
                    'cascadingListPush',
                    true,
                    true,
                    cascadingListItem
                );
            }
        }
    },

    _pop: {
        value: function () {
            var cascadingListItem = this.history.pop();

            this._currentColumnIndex--;
            cascadingListItem.context.isEditing = false;
            this.needsDraw = true;

            if (this.shouldDispatchCascadingListEvents) {
                this.dispatchEventNamed(
                    'cascadingListPop',
                    true,
                    true,
                    cascadingListItem
                );
            }

            return cascadingListItem;
        }
    },

    _populateColumnWithObjectAndIndex: {
        value: function (object, columnIndex, isEditing) {
            if (!this._populatePromise && object) {
                var self = this;

                this._populatePromise = this.loadUserInterfaceDescriptor(object).then(function (UIDescriptor) {
                    var context = self._createCascadingListContextWithObjectAndColumnIndex(
                        object,
                        columnIndex
                    );

                    context.userInterfaceDescriptor = UIDescriptor;
                    context.isEditing = !!isEditing;

                    self._push(context);
                    self._populatePromise = null;

                    return context;
                });
            }

            return this._populatePromise;
        }
    },

    _createCascadingListContextWithObjectAndColumnIndex: {
        value: function (object, columnIndex) {
            var context = new CascadingListContext();

            context.object = object;
            context.columnIndex = columnIndex;
            context.cascadingList = this;

            return context;
        }
    },

    _findListItemFromElement: {
        value: function (element) {
            var component;

            while (element && !(component = element.component)) {
                element = element.parentElement;
            }

            while (component && !(component instanceof ListItem)) {
                component = component.parentComponent;
            }

            return component;
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
            this._startPositionX = 0;
            this._startPositionY = 0;
            this._translateX = 0;
            this._translateY = 0;
            this._isDragging = false;
            this.__translateComposer.translateX = 0;
            this.__translateComposer.translateY = 0;
            this._draggingElementBoundingRect = null;
            this._isItemDragOverShelf = false;
            this.needsDraw = true;
        }
    },

    _findDataObjectFromElement: {
        value: function (element) {
            var component, dataObject;

            while (element && !(component = element.component)) {
                element = element.parentElement;
            }

            while (component && !(dataObject = component.data)) {
                component = component.parentComponent;
            }

            return dataObject;
        }
    },

    _isListItemOverShelf: {
        value: function () {
            if (this._shelfBoundingRect) {
                var x = this._startPositionX + this._translateX,
                    y = this._startPositionY + this._translateY;

                if (x >= this._shelfBoundingRect.left && x <= this._shelfBoundingRect.right &&
                    y >= this._shelfBoundingRect.top && y <= this._shelfBoundingRect.bottom
                ) {
                    return true;
                }
            }

            return false;
        }
    },

    /**
     * Draw Methods
     */

    willDraw: {
        value: function () {
            if (this.isResponsive) {
                this.isFlat = window.innerWidth >= this.shrinkForWidth;

                for (var i = 0; i < this.history.length; i++) {
                    var item = this.history[i];
                    item.isFlat = this.isFlat;
                }
            }

            if (this._isDragging) {
                if (!this._shelfBoundingRect) {
                    this._shelfBoundingRect = this.shelf.element.getBoundingClientRect();
                }

                if (this._draggingListItem && !this._draggingElementBoundingRect) {
                    this._draggingElementBoundingRect = this._draggingListItem.element.getBoundingClientRect();
                }
            }
        }
    },

    draw: {
        value: function () {
            if (this._isDragging) {
                this.element.classList.add('is-dragging-item');

                if (!this._ghostElement) {
                    this._ghostElement = this._draggingListItem.element.cloneNode(true);
                    this._ghostElement.classList.add("montage-cascadingList-ghostImage");
                    this._ghostElement.style.visibility = "hidden";
                    this._ghostElement.style.position = "absolute";
                    this._ghostElement.style.zIndex = 999999;
                    this._ghostElement.style.top = this._draggingElementBoundingRect.top + "px";
                    this._ghostElement.style.left = this._draggingElementBoundingRect.left + "px";
                    this._ghostElement.style.width = this._draggingElementBoundingRect.width + "px";
                    document.body.appendChild(this._ghostElement);
                    this._needsToWaitforGhostElementBoundaries = true;
                    this.needsDraw = true;
                }

                if (!this._needsToWaitforGhostElementBoundaries) {
                    // Delegate Method for ghost element positioning?
                    this._ghostElement.style.visibility = "visible";
                } else {
                    this._needsToWaitforGhostElementBoundaries = false;
                }

                this._ghostElement.style[CascadingList.cssTransform] = "translate3d(" +
                    this._translateX + "px," + this._translateY + "px,0)";
            } else {
                this.element.classList.remove('is-dragging-item');

                if (this._ghostElement) {
                    document.body.removeChild(this._ghostElement);
                    this._ghostElement = null;
                }
            }
        }
    }

});
