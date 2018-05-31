var Montage = require("../core").Montage,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    DraggingOperationInfo = require("./dragging-operation-info").DraggingOperationInfo;

var DRAG_SOURCE = 0;
var DRAG_DESTINATION = 1;
var TOUCH_POINTER = "touch";

var DragManager = exports.DragManager = Montage.specialize({

    __dragSources: {
        value: null
    },

    _dragSources: {
        get: function () {
            return this.__dragSources || (this.__dragSources = []);
        }
    },

    __dragDestinations: {
        value: null
    },

    _dragDestinations: {
        get: function () {
            return this.__dragDestinations || (this.__dragDestinations = []);
        }
    },

    _dragDestination: {
        value: null
    },

    __rootComponent: {
        value: null
    },

    _rootComponent: {
        set: function (component) {
            if (this.__rootComponent !== component) {
                if (this.__rootComponent) {
                    this.__rootComponent.removeComposer(
                        this._translateComposer
                    );
                }

                if (component) {
                    component.addComposerForElement(
                        this._translateComposer, component.element
                    );
                }

                this.__rootComponent = component;
            }
        },
        get: function () {
            return this.__rootComponent;
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
                this.__translateComposer.shouldCancelOnSroll = true;
                this.__translateComposer.translateX = 0;
                this.__translateComposer.translateY = 0;
                this.__translateComposer.lazyLoad = false;
            }

            return this.__translateComposer;
        }
    },

    _draggingOperationInfo: {
        value: null
    },

    _isDragging: {
        value: false
    },

    _willTerminateDraggingOperation: {
        value: false
    },

    _needsToWaitforDraggedImageBoundaries: {
        value: false
    },

    _dragSourceContainerBoundingRect: {
        value: null
    },

    _draggedImageBoundingRect: {
        value: null
    },

    _oldDragSourceDisplayStyle: {
        value: null
    },

    initWithComponent: {
        value: function (component) {
            this._rootComponent = component;
            var element = this._rootComponent.element;
                
            if ("webkitTransform" in element.style) {
                DragManager.cssTransform = "webkitTransform";
            } else if ("MozTransform" in element.style) {
                DragManager.cssTransform = "MozTransform";
            } else if ("oTransform" in element.style) {
                DragManager.cssTransform = "oTransform";
            } else {
                DragManager.cssTransform = "transform";
            }

            if (window.PointerEvent) {
                element.addEventListener("pointerdown", this, true);
            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                element.addEventListener("MSPointerDown", this, true);
            } else {
                element.addEventListener("touchstart", this, true);
            }

            this._translateComposer.addEventListener("translateStart", this);

            return this;
        }
    },

    registerForDragSource: {
        value: function (component) {
            this._register(component, DRAG_SOURCE);
        }
    },

    registerForDragDestination: {
        value: function (component) {
            this._register(component, DRAG_DESTINATION);
        }
    },

    unregisterForDragSource: {
        value: function (component) {
            this._unregister(component, DRAG_SOURCE);
        }
    },

    unregisterForDragDestination: {
        value: function (component) {
            this._unregister(component, DRAG_DESTINATION);
        }
    },

    /**
     * Private APIs
     */

     /**
     * @private
     * @function
     * @param {Component} component
     * @param {number} role - component's role -> drag source or destination
     * @description register an component to be a drag source or destination
     */
    _register: {
        value: function (component, role) {
            if (component) {
                var components = role === DRAG_SOURCE ?
                    this._dragSources : this._dragDestinations;

                if (components.indexOf(component) === -1) {
                    components.push(component);
                }
            }
        }
    },

    /**
     * @private
     * @function
     * @param {Component} component
     * @param {number} role - component's role -> drag source or destination
     * @description unregister an component from beeing 
     * a drag source or destination
     */
    _unregister: {
        value: function (component, role) {
            if (component) {
                var components = role === DRAG_SOURCE ?
                    this._dragSources : this._dragDestinations,
                    index;

                if ((index = components.indexOf(component)) > -1) {
                    components.splice(index, 1);
                }
            }
        }
    },

    /**
     * @private
     * @function
     * @param {Element} draggedImage - node element that will be used 
     * as a dragged image
     * @description set some default css style on the dragged image.
     */
    _createDraggingOperationInfoWithSourceAndPosition: {
        value: function (dragSource, startPosition) {
            var draggingOperationInfo = new DraggingOperationInfo();
            draggingOperationInfo.dragSource = dragSource;
            draggingOperationInfo.startPositionX = startPosition.pageX;
            draggingOperationInfo.startPositionY = startPosition.pageY;
            draggingOperationInfo.positionX = startPosition.pageX;
            draggingOperationInfo.positionY = startPosition.pageY;

            return draggingOperationInfo;
        }
    },

     /**
     * @private
     * @function
     * @param {Element} draggedImage - node element that will be used 
     * as a dragged image
     * @description set some default css style on the dragged image.
     */
    _sanitizeDraggedImage: {
        value: function (draggedImage) {
            draggedImage.classList.add("montage-dragged-image");
            draggedImage.style.visibility = "hidden";
            draggedImage.style.position = "absolute";
            draggedImage.style.pointerEvents = "none";
            draggedImage.style.boxSizing = "border-box";
            draggedImage.style.zIndex = 999999;
            draggedImage.style.opacity = 0.95;

            return draggedImage;
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationInfo} draggingOperationInfo - current dragging 
     * operation info object
     * @description Dispatch to drag destinations that 
     * the dragging operation has started.
     */
    _dispatchDraggingOperationStart: {
        value: function (draggingOperationInfo) {
            var dragDestinations = this._dragDestinations,
                component;

            for (var i = 0, length = dragDestinations.length; i < length; i++) {
                component = dragDestinations[i];
                component._draggingStarted(draggingOperationInfo);
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationInfo} draggingOperationInfo - current dragging 
     * operation info object
     * @description Dispatch to drag destinations that 
     * the dragging operation has ended.
     */
    _dispatchDraggingOperationEnd: {
        value: function (draggingOperationInfo) {
            var dragDestinations = this._dragDestinations,
                component;
            
            for (var i = 0, length = dragDestinations.length; i < length; i++) {
                component = dragDestinations[i];
                component._draggingEnded(draggingOperationInfo);
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationInfo} draggingOperationInfo - current dragging 
     * operation info object
     * @description Notify to the drag destination 
     * to perform the drag operation.
     */
    _notifyDragDestinationToPerformDragOperation: {
        value: function (draggingOperationInfo) {
            if (this._dragDestination) {
                this._dragDestination._performDragOperation(
                    draggingOperationInfo
                );
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationInfo} draggingOperationInfo - current dragging 
     * operation info object
     * @description Notify to the drag destination 
     * to conclude the drag operation.
     */
    _notifyDragDestinationToConcludeDragOperation: {
        value: function (draggingOperationInfo) {
            if (this._dragDestination) {
                this._dragDestination._concludeDragOperation(
                    draggingOperationInfo
                );
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationInfo} draggingOperationInfo - current dragging 
     * operation info object
     * @description Notify to the drag destination 
     * that the dragged image has entered its bounds rectangle.
     */
    _notifyDragDestinationDraggedImageHasEntered: {
        value: function (draggingOperationInfo) {
            if (this._dragDestination) {
                this._dragDestination._draggingEntered(
                    draggingOperationInfo
                );
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationInfo} draggingOperationInfo - current dragging 
     * operation info object
     * @description Notify to the drag destination 
     * that the dragged image is held within its bounds rectangle.
     */
    _notifyDragDestinationDraggedImageHasUpdated: {
        value: function (draggingOperationInfo) {
            if (this._dragDestination) {
                this._dragDestination._draggingUpdated(
                    draggingOperationInfo
                );
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationInfo} draggingOperationInfo - current dragging 
     * operation info object
     * @description Notify to the drag destination 
     * that the dragged image has exited its bounds rectangle.
     */
    _notifyDragDestinationDraggedImageHasExited: {
        value: function (draggingOperationInfo) {
            if (this._dragDestination) {
                this._dragDestination._draggingExited(
                    draggingOperationInfo
                );
            }
        }
    },

     /**
     * @private
     * @function
     * @param {string} positionX - x coordinate
     * @param {string} positionY - y coordinate
     * @description try to find a drag source at the given position.
     * @returns {Component|null}
     */
    _findDragSourceAtPosition: {
        value: function (positionX, positionY) {
            return this._findRegisteredComponentAtPosistion(
                positionX,
                positionY, 
                DRAG_SOURCE
            );
        }
    },

    /**
     * @private
     * @function
     * @param {string} positionX - x coordinate
     * @param {string} positionY - y coordinate
     * @description try to find a drag destination at the given position.
     * @returns {Component|null}
     */
    _findDragDestinationAtPosition: {
        value: function (positionX, positionY) {
            var dragDestination = this._findRegisteredComponentAtPosistion(
                positionX,
                positionY, 
                DRAG_DESTINATION
            );

            return dragDestination && dragDestination.acceptDragOperation ? 
                dragDestination : null;
        }
    },

    /**
     * @private
     * @function
     * @param {string} positionX - x coordinate
     * @param {string} positionY - y coordinate
     * @description try to find a drag source or destination 
     * at the given position.
     * @returns {Component|null}
     */
    _findRegisteredComponentAtPosistion: {
        value: function (positionX, positionY, role) {
            var targetComponent = this._findComponentAtPosition(
                positionX, positionY
            ),
            registeredComponent = null;

            if (targetComponent) {
                var components = role === DRAG_SOURCE ? 
                    this._dragSources : this._dragDestinations,
                    index;

                while (targetComponent) {
                    if ((index = components.indexOf(targetComponent)) > -1) {
                        registeredComponent = components[index];
                        targetComponent = null;
                    } else {
                        targetComponent = targetComponent.parentComponent;
                    }
                }
            }

            return registeredComponent;
        }
    },

    /**
     * @private
     * @function
     * @param {string} positionX - x coordinate
     * @param {string} positionY - y coordinate
     * @description try to find a component at the given position.
     * @returns {Component|null}
     */
    _findComponentAtPosition: {
        value: function (positionX, positionY) {
            var element = document.elementFromPoint(positionX, positionY),
                component = null;

            if (element) {
                while (element && !(component = element.component)) {
                    element = element.parentElement;
                }
            }

            return component;
        }
    },

    /**
     * @private
     * @function
     * @description add translate listeners.
     */
    _addTranslateListeners: {
        value: function () {
            this._translateComposer.addEventListener('translate', this);
            this._translateComposer.addEventListener('translateEnd', this);
            this._translateComposer.addEventListener('translateCancel', this);
        }
    },

    /**
     * @private
     * @function
     * @description remove translate listeners.
     */
    _removeTranslateListeners: {
        value: function () {
            this._translateComposer.removeEventListener('translate', this);
            this._translateComposer.removeEventListener('translateEnd', this);
            this._translateComposer.removeEventListener('translateCancel', this);
        }
    },

    /**
     * @private
     * @function
     * @description reset the dragging operation context.
     */
    _resetTranslateContext: {
        value: function () {
            this._removeTranslateListeners();
            this._isDragging = false;
            this.__translateComposer.translateX = 0;
            this.__translateComposer.translateY = 0;
            this._oldDragSourceDisplayStyle = null;
            this._draggedImageBoundingRect = null;
            this._dragSourceContainerBoundingRect = null;
            this._willTerminateDraggingOperation = false;
            this._needsToWaitforDraggedImageBoundaries = false;
        }
    },

    /**
     * Events Handlers
     */

    capturePointerdown: {
        value: function (event) {
            if (event.pointerType === TOUCH_POINTER || 
                (window.MSPointerEvent && 
                    event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH)
            ) {
                this.captureTouchstart(event);
            }
        }
    },

    captureTouchstart: {
        value: function (event) {
            var dragSource = this._findDragSourceAtPosition(
                event.pageX,
                event.pageY
            );

            if (dragSource) {
                if (window.PointerEvent) {
                    this._rootComponent.element.addEventListener(
                        "pointermove", this, true
                    );
                } else if (
                    window.MSPointerEvent && 
                    window.navigator.msPointerEnabled
                ) {
                    this._rootComponent.element.addEventListener(
                        "MSPointerMove", this, true
                    );
                } else {
                    this._rootComponent.element.addEventListener(
                        "touchmove", this, true
                    );
                }
            }
        }
    },

    capturePointermove: {
        value: function (event) {
            this.captureTouchmove(event);
        }
    },

    captureTouchmove: {
        value: function (event) {
            // Prevent Scroll on touch devices
            event.preventDefault();

            if (window.PointerEvent) {
                this._rootComponent.element.removeEventListener(
                    "pointermove", this, true
                );
            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._rootComponent.element.removeEventListener(
                    "MSPointerMove", this, true
                );
            } else {
                this._rootComponent.element.removeEventListener(
                    "touchmove", this, true
                );
            }
        }
    },

    handleTranslateStart: {
        value: function (event) {
            var startPosition = this._translateComposer.pointerStartEventPosition,
                dragSource = this._findDragSourceAtPosition(
                    startPosition.pageX,
                    startPosition.pageY
                ),
                draggedImage;

            if (dragSource) {
                var draggingOperationInfo;

                this._draggingOperationInfo = (draggingOperationInfo = (
                    this._createDraggingOperationInfoWithSourceAndPosition(
                        dragSource, 
                        startPosition
                    )
                ));

                draggingOperationInfo.dragOperationType = (
                    dragSource.dragOperationType || 
                    DragManager.DragOperationCopy
                );

                dragSource._beginDraggingOperation(draggingOperationInfo);
                
                if (!draggingOperationInfo.draggedImage) {
                    draggedImage = dragSource.element.cloneNode(true);
                } else {
                    draggedImage = draggingOperationInfo.draggedImage;
                }

                draggingOperationInfo.draggedImage = this._sanitizeDraggedImage(
                    draggedImage
                );

                this._dispatchDraggingOperationStart(draggingOperationInfo);
                this._addTranslateListeners();

                this._isDragging = true;
                this._rootComponent.needsDraw = true;
            } else {
                this._translateComposer._cancel();
            }
        }
    },

    handleTranslate: {
        value: function (event) {
            this._draggingOperationInfo.deltaX = event.translateX;
            this._draggingOperationInfo.deltaY = event.translateY;
            this._draggingOperationInfo.positionX = (
                this._draggingOperationInfo.startPositionX + event.translateX
            );
            this._draggingOperationInfo.positionY = (
                this._draggingOperationInfo.startPositionY + event.translateY
            );

            var dragDestination = this._findDragDestinationAtPosition(
                this._draggingOperationInfo.positionX,
                this._draggingOperationInfo.positionY
            );      
            
            this._draggingOperationInfo.dragSource._updateDraggingOperation(
                this._draggingOperationInfo
            );

            if (dragDestination !== this._dragDestination) {
                if (this._dragDestination) {
                    this._notifyDragDestinationDraggedImageHasExited();
                }

                if (dragDestination) {
                    this._notifyDragDestinationDraggedImageHasEntered();
                }
            } else if (dragDestination) {
                this._notifyDragDestinationDraggedImageHasUpdated();
            }

            this._dragDestination = dragDestination;

            this._rootComponent.needsDraw = true;
        }
    },

    handleTranslateEnd: {
        value: function () {
            this._willTerminateDraggingOperation = true;
            this._rootComponent.needsDraw = true;
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._dragDestination = null;
            this._willTerminateDraggingOperation = true;
            this._rootComponent.needsDraw = true;
        }
    },

    /**
     * Draw Cycles Management
     */

    willDraw: { 
        value: function () {
            if (this._isDragging) {
                var draggingOperationInfo;

                if ((draggingOperationInfo = this._draggingOperationInfo) && 
                    !this._draggedImageBoundingRect
                ) {
                    this._draggedImageBoundingRect = (
                        draggingOperationInfo.dragSource.element.getBoundingClientRect()
                    );
    
                    if (draggingOperationInfo.dragSourceContainer) {
                        this._dragSourceContainerBoundingRect = (
                            draggingOperationInfo.dragSourceContainer.getBoundingClientRect()
                        );
                    }
                }
            }
        }
    },

    draw: {
        value: function () {
            var draggingOperationInfo = this._draggingOperationInfo;

            if (this._isDragging && !this._willTerminateDraggingOperation) {
                var draggedImage = draggingOperationInfo.draggedImage,
                    translateX = draggingOperationInfo.deltaX,
                    translateY = draggingOperationInfo.deltaY;

                this._setUpDraggedImageIfNeeded(draggedImage);

                if (!this._needsToWaitforDraggedImageBoundaries) {
                    draggedImage.style.visibility = "visible";
                } else {
                    this._needsToWaitforDraggedImageBoundaries = false;
                }

                if (this._dragSourceContainerBoundingRect) {
                    var rect = this._dragSourceContainerBoundingRect,
                        deltaPointerLeft, deltaPointerRight,
                        deltaPointerTop, deltaPointerBottom;

                    if (draggingOperationInfo.positionX - (
                        deltaPointerLeft = (
                            draggingOperationInfo.startPositionX - 
                            this._draggedImageBoundingRect.left
                        )
                    ) < rect.left) {
                        translateX = (
                            rect.left - 
                            draggingOperationInfo.startPositionX + 
                            deltaPointerLeft
                        );
                    } else if (draggingOperationInfo.positionX + (
                        deltaPointerRight = (
                            this._draggedImageBoundingRect.right - 
                            draggingOperationInfo.startPositionX
                        )
                    ) > rect.right) {
                        translateX = (
                            rect.right - 
                            draggingOperationInfo.startPositionX - 
                            deltaPointerRight
                        );
                    }
                    
                    if (draggingOperationInfo.positionY - (
                        deltaPointerTop = (
                            draggingOperationInfo.startPositionY - 
                            this._draggedImageBoundingRect.top
                        )
                    ) < rect.top) {
                        translateY = (
                            rect.top - 
                            draggingOperationInfo.startPositionY + 
                            deltaPointerTop
                        );
                    } else if (draggingOperationInfo.positionY + (
                        deltaPointerBottom = (
                            this._draggedImageBoundingRect.bottom - 
                            draggingOperationInfo.startPositionY
                        )
                    ) > rect.bottom) {
                        translateY = (
                            rect.bottom - 
                            draggingOperationInfo.startPositionY - 
                            deltaPointerBottom
                        );
                    }
                }

                draggedImage.style[DragManager.cssTransform] = "translate3d(" +
                    translateX + "px," + translateY + "px,0)";

                if (
                    this._dragDestination && 
                    draggingOperationInfo.dragOperationType === 
                    DragManager.DragOperationCopy
                ) {
                    this._rootComponent.element.style.cursor = 'copy';
                } else {
                    this._rootComponent.element.style.cursor = 'move';
                }
            } else if (this._willTerminateDraggingOperation) {
                this._rootComponent.element.style.cursor = 'default';
                document.body.removeChild(draggingOperationInfo.draggedImage);

                if (this._dragDestination) {
                    draggingOperationInfo.hasBeenDrop = true;
                    draggingOperationInfo.dragDestination = this._dragDestination;
                }

                this._notifyDragDestinationToPerformDragOperation(
                    draggingOperationInfo
                );
                
                this._resetTranslateContext();
                
                this._notifyDragDestinationToConcludeDragOperation(
                    draggingOperationInfo
                );

                this._dragDestination = null;

                draggingOperationInfo.dragSource._endDraggingOperation(
                    draggingOperationInfo
                );

                this._dispatchDraggingOperationEnd(
                    draggingOperationInfo
                );

                if (
                    draggingOperationInfo.dragOperationType === 
                    DragManager.DragOperationMove
                ) {
                    this._shouldRemovePlaceholder = true;
                    this._rootComponent.needsDraw = true;
                    // Wait for the next draw cycle to remove the placeholder,
                    // allowing the receiver to perform any necessary clean-up. 
                    return void 0;
                }
            }

            this._removeDragSourcePlaceholderIfNeeded(draggingOperationInfo);
        }
    },

    _setUpDraggedImageIfNeeded: {
        value: function (draggedImage) {
            var draggingOperationInfo = this._draggingOperationInfo;

            if (!draggedImage.parentElement) {
                var draggedImageBoundingRect = this._draggedImageBoundingRect;
                draggedImage.style.top = draggedImageBoundingRect.top + "px";
                draggedImage.style.left = draggedImageBoundingRect.left + "px";
                draggedImage.style.width = draggedImageBoundingRect.width + "px";
                draggedImage.style.height = draggedImageBoundingRect.height + "px";

                if (
                    draggingOperationInfo.dragOperationType === 
                    DragManager.DragOperationMove
                ) {
                    var dragSourceElement = draggingOperationInfo.dragSource.element;
                    this._oldDragSourceDisplayStyle = dragSourceElement.style.display;
                    dragSourceElement.style.display = 'none'; 

                    if (
                        draggingOperationInfo.dragSourcePlaceholderStrategy === 
                        DragManager.DragSourcePlaceholderStrategyVisible
                    ) {
                        var placeholderElement = document.createElement('div');
                        placeholderElement.style.width = (
                            draggedImageBoundingRect.width + "px"
                        );
                        placeholderElement.style.height = (
                            draggedImageBoundingRect.height + "px"
                        );
                        placeholderElement.style.boxSizing = "border-box";
                        placeholderElement.classList.add(
                            'montage-drag-source-placeholder'
                        );

                        dragSourceElement.parentNode.insertBefore(
                            placeholderElement, 
                            dragSourceElement
                        );

                        this._placeholderElement = placeholderElement;
                    }
                }

                document.body.appendChild(draggedImage);
                draggingOperationInfo.isDraggOperationStarted = true;
                this._needsToWaitforDraggedImageBoundaries = true;
            }
        }
    },

    _removeDragSourcePlaceholderIfNeeded: {
        value: function (draggingOperationInfo) {
            if (this._shouldRemovePlaceholder && draggingOperationInfo) {
                var dragSourceElement = draggingOperationInfo.dragSource.element;

                dragSourceElement.style.display = this._oldDragSourceDisplayStyle; 

                if (
                    draggingOperationInfo.dragSourcePlaceholderStrategy === 
                    DragManager.DragSourcePlaceholderStrategyVisible
                ) {
                    dragSourceElement.parentNode.removeChild(
                        this._placeholderElement
                    );
                }

                this._shouldRemovePlaceholder = false;
            }
        }
    }

}, {

    DragOperationCopy: {
        value: 0
    },

    DragOperationLink: {
        value: 1
    },

    DragOperationMove: {
        value: 2
    },

    DragOperationAll :{
        value: 3
    },

    DragSourcePlaceholderStrategyHidden: {
        value: 0
    },

    DragSourcePlaceholderStrategyVisible: {
        value: 1
    }

});

DragManager.prototype.captureMSPointerDown = DragManager.prototype.capturePointerdown;
DragManager.prototype.captureMSPointerMove = DragManager.prototype.capturePointermove;
