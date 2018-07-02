var Montage = require("../core").Montage,
    DragEvent = require("./drag-event").DragEvent,
    DataTransfer = require("./drag-event").DataTransfer,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    DraggingOperationContext = require("./dragging-operation-context").DraggingOperationContext;

var DRAGGABLE = 0;
var DROPABBLE = 1;
var TOUCH_POINTER = "touch";
var PX = "px";

var DragManager = exports.DragManager = Montage.specialize({

    __draggables: {
        value: null
    },

    _draggables: {
        get: function () {
            return this.__draggables || (this.__draggables = []);
        }
    },

    __droppables: {
        value: null
    },

    _droppables: {
        get: function () {
            return this.__droppables || (this.__droppables = []);
        }
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

    _draggingOperationContext: {
        value: null
    },

    _willTerminateDraggingOperation: {
        value: false
    },

    _needsToWaitforDraggedImageBoundaries: {
        value: false
    },

    _draggableContainerBoundingRect: {
        value: null
    },

    _draggedImageBoundingRect: {
        value: null
    },

    _oldDraggableDisplayStyle: {
        value: null
    },

    _dragEnterCounter: {
        value: 0
    },

    _cursorStyle: {
        value: null
    },

    _scrollThreshold: {
        value: 25 //px
    },

    _shouldRemovePlaceholder: {
        value: false
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
            element.addEventListener("dragenter", this, true);

            return this;
        }
    },

     /**
     * @public
     * @function
     * @param {Component} component - a component
     * @description Register a component to be draggable
     */
    registerDraggable: {
        value: function (component) {
            this._register(component, DRAGGABLE);
        }
    },

     /**
     * @public
     * @function
     * @param {Component} component - a component
     * @description Register a component to be droppable
     */
    registerDroppable: {
        value: function (component) {
            this._register(component, DROPABBLE);
        }
    },

     /**
     * @public
     * @function
     * @param {Component} component - a component
     * @description Unregister a component to be draggable
     */
    unregisterDraggable: {
        value: function (component) {
            this._unregister(component, DRAGGABLE);
        }
    },

    /**
     * @public
     * @function
     * @param {Component} component - a component
     * @description Unregister a component to be droppable
     */
    unregisterDroppable: {
        value: function (component) {
            this._unregister(component, DROPABBLE);
        }
    },

    /**
     * Private APIs
     */

     /**
     * @private
     * @function
     * @param {Component} component
     * @param {number} role - component's role -> draggable or droppable
     * @description register an component to be draggable or droppable
     */
    _register: {
        value: function (component, role) {
            if (component) {
                var components = role === DRAGGABLE ?
                    this._draggables : this._droppables;

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
     * @param {number} role - component's role -> draggable or droppable
     * @description unregister an component from beeing draggable or droppable
     */
    _unregister: {
        value: function (component, role) {
            if (component) {
                var components = role === DRAGGABLE ?
                    this._draggables : this._droppables,
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
     * @param {Object} startPosition - coordinates of the start position
     * @description set some default css style on the dragged image.
     */
    _createDraggingOperationContextWithDraggableAndPosition: {
        value: function (draggable, startPosition) {
            var draggingOperationContext = new DraggingOperationContext();
            draggingOperationContext.draggable = draggable;
            draggingOperationContext.startPositionX = startPosition.pageX;
            draggingOperationContext.startPositionY = startPosition.pageY;
            draggingOperationContext.positionX = startPosition.pageX;
            draggingOperationContext.positionY = startPosition.pageY;

            return draggingOperationContext;
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
     * @param {string} type drag event type
     * @param {DraggingOperationContext} draggingOperationContext dragging operation context
     * @description Create a Custon Drag Event
     */
    _createDragEvent: {
        value: function (type, draggingOperationContext) {
            var dragEvent = new DragEvent(type);

            if (!draggingOperationContext.dataTransfer) {
                draggingOperationContext.dataTransfer = dragEvent.dataTransfer;
            } else {
                dragEvent.dataTransfer = draggingOperationContext.dataTransfer;
            }

            return dragEvent;
        }
    },

    /**
     * @private
     * @function
     * @description Dispatch Drag Start Event
     */
    _dispatchDragStart: {
        value: function () {
            var draggable = this._draggingOperationContext.draggable,
                dragStartEvent = this._createDragEvent(
                    "dragstart", this._draggingOperationContext
                );

            if (draggable) {
                draggable.dispatchEvent(dragStartEvent);
            } else {
                this._rootComponent.application.dispatchEvent(dragStartEvent);
            }

            this._draggingOperationContext.dropTargetCandidates = (
                dragStartEvent.dataTransfer.dropTargetCandidates
            );

            this._draggingOperationContext.dropTargetCandidates.forEach(
                function (droppable) {
                    droppable.classList.add('valid-drop-target');
                }
            );

            return dragStartEvent;
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationContext} draggingOperationContext - current dragging 
     * operation info object
     * @description Dispatch Drag End Event
     */
    _dispatchDragEnd: {
        value: function (draggingOperationContext) {
            draggingOperationContext.dropTargetCandidates.forEach(function (droppable) {
                droppable.classList.remove('valid-drop-target');
            });

            if (draggingOperationContext.draggable) {
                draggingOperationContext.draggable.dispatchEvent(
                    this._createDragEvent(
                        "dragend", draggingOperationContext
                    )
                );
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationContext} draggingOperationContext - current dragging 
     * operation info object
     * @description Dispatch Drop Event
     */
    _dispatchDrop: {
        value: function (draggingOperationContext) {
            if (draggingOperationContext.currentDropTarget) {
                draggingOperationContext.currentDropTarget.classList.remove("drag-enter");
                draggingOperationContext.currentDropTarget.classList.remove("drag-over");

                draggingOperationContext.currentDropTarget.dispatchEvent(this._createDragEvent(
                    "drop", draggingOperationContext
                ));
            }
        }
    },

    /**
     * @private
     * @function
     * @description Dispatch Drag Enter Event
     */
    _dispatchDragEnter: {
        value: function (draggingOperationContext) {
            if (draggingOperationContext.currentDropTarget) {
                draggingOperationContext.currentDropTarget.classList.add("drag-enter");
                var dragEnterEvent = this._createDragEvent(
                    "dragenter", draggingOperationContext
                );

                draggingOperationContext.currentDropTarget.dispatchEvent(dragEnterEvent);
                draggingOperationContext.dropEffect = (
                    dragEnterEvent.dataTransfer.dropEffect || "default"
                );
            }
        }
    },

    /**
     * @private
     * @function
     * @description Dispatch Drag Over Event
     */
    _dispatchDragOver: {
        value: function (draggingOperationContext) {
            if (draggingOperationContext.currentDropTarget) {
                draggingOperationContext.currentDropTarget.classList.add("drag-over");
                var dragOverEvent = this._createDragEvent(
                    "dragover", draggingOperationContext
                );

                draggingOperationContext.currentDropTarget.dispatchEvent(dragOverEvent);
                draggingOperationContext.dropEffect = (
                    dragOverEvent.dataTransfer.dropEffect || "default"
                );
            }
        }
    },

    /**
     * @private
     * @function
     * @param {DraggingOperationContext} draggingOperationContext - current dragging 
     * operation info object
     * @description Dispatch Drag Leave Event
     */
    _dispatchDragLeave: {
        value: function (draggingOperationContext) {
            if (draggingOperationContext.currentDropTarget) {
                draggingOperationContext.currentDropTarget.classList.remove(
                    "drag-over", "drag-enter"
                );

                draggingOperationContext.currentDropTarget.dispatchEvent(this._createDragEvent(
                    "dragleave", draggingOperationContext
                ));
            }
        }
    },

     /**
     * @private
     * @function
     * @param {string} positionX - x coordinate
     * @param {string} positionY - y coordinate
     * @description try to find a draggable component at the given position.
     * @returns {Component|null}
     */
    _findDraggableAtPosition: {
        value: function (positionX, positionY) {
            return this._findRegisteredComponentAtPosistion(
                positionX,
                positionY, 
                DRAGGABLE
            );
        }
    },

    /**
     * @private
     * @function
     * @param {string} positionX - x coordinate
     * @param {string} positionY - y coordinate
     * @description try to find a droppable component at the given position.
     * @returns {Component|null}
     */
    _findDroppableAtPosition: {
        value: function (positionX, positionY) {
            return this._findRegisteredComponentAtPosistion(
                positionX,
                positionY, 
                DROPABBLE
            );
        }
    },

    /**
     * @private
     * @function
     * @param {string} positionX - x coordinate
     * @param {string} positionY - y coordinate
     * @description try to find a droppable or draggable component
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
                var components = role === DRAGGABLE ? 
                    this._draggables : this._droppables,
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

            // that is done at several place in the framework
            // we should re-organize that 
            while (element && !(component = element.component)) {
                element = element.parentElement;
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
     * @description add drag event listeners.
     */
    _addDragListeners: {
        value: function () {
            var element = this._rootComponent.element;
            element.addEventListener("dragover", this, true);
            element.addEventListener("drop", this, true);
            element.addEventListener("dragleave", this, true);
        }
    },

    /**
     * @private
     * @function
     * @description remove drag event listeners.
     */
    _removeDragListeners: {
        value: function () {
            var element = this._rootComponent.element;
            element.removeEventListener("dragover", this, true);
            element.removeEventListener("drop", this, true);
            element.removeEventListener("dragleave", this, true);
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
            this._removeDragListeners();
            this._dragEnterCounter = 0;
            this._draggingOperationContext.isDragging = false;
            this.__translateComposer.translateX = 0;
            this.__translateComposer.translateY = 0;
            this._oldDraggableDisplayStyle = null;
            this._draggedImageBoundingRect = null;
            this._draggableContainerBoundingRect = null;
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
            var draggable = this._findDraggableAtPosition(
                event.pageX,
                event.pageY
            );

            if (draggable) {
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

    captureDragenter: {
        value: function (event) {
            if (!this._draggingOperationContext && !(event instanceof DragEvent)) {
                var types = event.dataTransfer.types,
                    draggingOperationContext;

                this._draggingOperationContext = (draggingOperationContext = (
                    this._createDraggingOperationContextWithDraggableAndPosition(
                        null, 
                        event
                    )
                ));

                draggingOperationContext.dataTransfer = (
                    DataTransfer.fromDataTransfer(event.dataTransfer)
                );

                var dragStartEvent = this._dispatchDragStart();

                draggingOperationContext.dragEffect = (
                    dragStartEvent.dataTransfer.dragEffect
                );
                
                this._addDragListeners();
                draggingOperationContext.isDragging = true;
                this._rootComponent.needsDraw = true;
            }
            
            this._dragEnterCounter++;
        }
    },

    captureDragover: {
        value: function (event) {
            if (this._draggingOperationContext.currentDropTarget) {
                event.preventDefault();
            }

            if (
                this._draggingOperationContext.positionX !== event.pageX ||
                this._draggingOperationContext.positionY !== event.pageY
            ) {
                this._draggingOperationContext.deltaX = (
                    event.pageX - this._draggingOperationContext.startPositionX
                );
                this._draggingOperationContext.deltaY = (
                    event.pageY - this._draggingOperationContext.startPositionY
                );
                this._draggingOperationContext.positionX = event.pageX;
                this._draggingOperationContext.positionY = event.pageY;
                this._draggingOperationContext.dataTransfer = event.dataTransfer;

                this._draggingOperationContext.dataTransfer = (
                    DataTransfer.fromDataTransfer(event.dataTransfer)
                );

                this._rootComponent.needsDraw = true;
            }
        }
    },

    captureDrop: {
        value: function (event) {
            event.preventDefault();
            event.stopPropagation();
            
            this._draggingOperationContext.deltaX = (
                event.pageX - this._draggingOperationContext.startPositionX
            );
            this._draggingOperationContext.deltaY = (
                event.pageY - this._draggingOperationContext.startPositionY
            );
            this._draggingOperationContext.positionX = event.pageX;
            this._draggingOperationContext.positionY = event.pageY;
            this._draggingOperationContext.dataTransfer = (
                DataTransfer.fromDataTransfer(event.dataTransfer)
            );
            
            this._removeDragListeners();
            this.handleTranslateEnd();
        }
    },

    captureDragleave: {
        value: function (event) {
            this._dragEnterCounter--;

            if (!this._dragEnterCounter) {
                this.handleTranslateCancel();
            }
        }
    },

    handleTranslateStart: {
        value: function (event) {
            var startPosition = this._translateComposer.pointerStartEventPosition,
                draggable = this._findDraggableAtPosition(
                    startPosition.pageX,
                    startPosition.pageY
                );

            if (draggable) {
                var draggingOperationContext, draggedImage;

                this._draggingOperationContext = (draggingOperationContext = (
                    this._createDraggingOperationContextWithDraggableAndPosition(
                        draggable, 
                        startPosition
                    )
                ));

                var dragStartEvent = this._dispatchDragStart();
                
                this._draggingOperationContext.dataTransfer = dragStartEvent.dataTransfer;
                this._draggingOperationContext.dragEffect = dragStartEvent.dataTransfer.dragEffect;
                this._draggingOperationContext.showPlaceholder = (
                    dragStartEvent.dataTransfer.showPlaceholder
                );

                if (!(draggedImage = dragStartEvent.dataTransfer.getDragImage())) {
                    draggedImage = draggable.element.cloneNode(true);
                }

                draggingOperationContext.draggedImage = this._sanitizeDraggedImage(
                    draggedImage
                );

                this._addTranslateListeners();
                draggingOperationContext.isDragging = true;
                this._rootComponent.needsDraw = true;
            } else {
                this._translateComposer._cancel();
            }
        }
    },

    handleTranslate: {
        value: function (event) {
            this._draggingOperationContext.deltaX = event.translateX;
            this._draggingOperationContext.deltaY = event.translateY;
            this._draggingOperationContext.positionX = (
                this._draggingOperationContext.startPositionX + event.translateX
            );
            this._draggingOperationContext.positionY = (
                this._draggingOperationContext.startPositionY + event.translateY
            );
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
            this.draggingOperationContext.currentDropTarget = null;
            this._willTerminateDraggingOperation = true;
            this._rootComponent.needsDraw = true;
        }
    },

    /**
     * Draw Cycles Management
     */

    willDraw: { 
        value: function () {
            var draggingOperationContext;

            if (
                (draggingOperationContext = this._draggingOperationContext) &&
                draggingOperationContext.isDragging
            ) {
                var draggable = draggingOperationContext.draggable;

                if ( 
                    !this._draggedImageBoundingRect && 
                    draggingOperationContext.draggable
                ) {
                    this._draggedImageBoundingRect = (
                        draggingOperationContext.draggable.element.getBoundingClientRect()
                    );
    
                    if (draggable.draggableContainer) {
                        this._draggableContainerBoundingRect = (
                            draggable.draggableContainer.getBoundingClientRect()
                        );
                    }
                } else {
                    var droppable = this._findDroppableAtPosition(
                        draggingOperationContext.positionX,
                        draggingOperationContext.positionY
                    );

                    if (droppable && 
                        !draggingOperationContext.dropTargetCandidates.has(
                            droppable
                        )
                    ) {
                        droppable.classList.add('invalid-drop-target');
                        this._invalidDroppable = droppable;
                        droppable = null;
                    } else if (this._invalidDroppable) {
                        this._invalidDroppable.classList.remove('invalid-drop-target');
                        this._invalidDroppable = null;
                    }
                    
                    if (draggable) {
                        draggable.dispatchEvent(this._createDragEvent(
                            "drag", draggingOperationContext
                        ));
                    }
                            
                    if (droppable !== draggingOperationContext.currentDropTarget) {
                        if (draggingOperationContext.currentDropTarget) {
                            this._dispatchDragLeave(
                                draggingOperationContext
                            );
                        }

                        draggingOperationContext.currentDropTarget = droppable;

                        if (droppable) {
                            this._dispatchDragEnter(
                                draggingOperationContext
                            );
                        }
                    } else if (droppable) {
                        this._dispatchDragOver(
                            draggingOperationContext
                        );
                    } else {
                        draggingOperationContext.currentDropTarget = null;
                    }

                    if (droppable) {
                        this._cursorStyle = draggingOperationContext.dropEffect;
                    } else {
                        this._cursorStyle = draggingOperationContext.dragEffect;
                    }
                }
            }
        }
    },

    draw: {
        value: function () {
            var draggingOperationContext = this._draggingOperationContext;

            if (
                draggingOperationContext &&
                draggingOperationContext.isDragging &&
                !this._willTerminateDraggingOperation
            ) {
                var draggedImage = draggingOperationContext.draggedImage;

                if (draggedImage) {
                    var translateX = draggingOperationContext.deltaX,
                        translateY = draggingOperationContext.deltaY;

                    this._drawDraggedImageIfNeeded(draggedImage);

                    if (!this._needsToWaitforDraggedImageBoundaries) {
                        draggedImage.style.visibility = "visible";
                    } else {
                        this._needsToWaitforDraggedImageBoundaries = false;
                    }

                    if (this._draggableContainerBoundingRect) {
                        var rect = this._draggableContainerBoundingRect,
                            deltaPointerLeft, deltaPointerRight,
                            deltaPointerTop, deltaPointerBottom;

                        if (draggingOperationContext.positionX - (
                            deltaPointerLeft = (
                                draggingOperationContext.startPositionX - 
                                this._draggedImageBoundingRect.left
                            )
                        ) < rect.left) {
                            translateX = (
                                rect.left - 
                                draggingOperationContext.startPositionX + 
                                deltaPointerLeft
                            );
                        } else if (draggingOperationContext.positionX + (
                            deltaPointerRight = (
                                this._draggedImageBoundingRect.right - 
                                draggingOperationContext.startPositionX
                            )
                        ) > rect.right) {
                            translateX = (
                                rect.right - 
                                draggingOperationContext.startPositionX - 
                                deltaPointerRight
                            );
                        }
                        
                        if (draggingOperationContext.positionY - (
                            deltaPointerTop = (
                                draggingOperationContext.startPositionY - 
                                this._draggedImageBoundingRect.top
                            )
                        ) < rect.top) {
                            translateY = (
                                rect.top - 
                                draggingOperationContext.startPositionY + 
                                deltaPointerTop
                            );
                        } else if (draggingOperationContext.positionY + (
                            deltaPointerBottom = (
                                this._draggedImageBoundingRect.bottom - 
                                draggingOperationContext.startPositionY
                            )
                        ) > rect.bottom) {
                            translateY = (
                                rect.bottom - 
                                draggingOperationContext.startPositionY - 
                                deltaPointerBottom
                            );
                        }
                    }

                    var translate = "translate3d(";
                    translate += translateX;
                    translate += "px,";
                    translate += translateY;
                    translate += "px,0)";

                    draggedImage.style[DragManager.cssTransform] = translate;

                    this._scrollIfNeeded(
                        draggingOperationContext.positionX, 
                        draggingOperationContext.positionY
                    );
                }

                this._rootComponent.element.style.cursor = this._cursorStyle;

            } else if (this._willTerminateDraggingOperation) {
                this._rootComponent.element.style.cursor = "default";

                if (draggingOperationContext.draggedImage) {
                    document.body.removeChild(draggingOperationContext.draggedImage);
                }

                if (draggingOperationContext.currentDropTarget) {
                    draggingOperationContext.hasBeenDrop = true;
                    draggingOperationContext.droppable = draggingOperationContext.currentDropTarget;
                }

                this._dispatchDrop(
                    draggingOperationContext
                );
                
                this._resetTranslateContext();
                draggingOperationContext.currentDropTarget = null;
                this._dispatchDragEnd(draggingOperationContext);

                if (
                    draggingOperationContext.draggable &&
                    draggingOperationContext.dragEffect === "move"
                ) {
                    this._shouldRemovePlaceholder = true;
                    this._rootComponent.needsDraw = true;
                    // Wait for the next draw cycle to remove the placeholder,
                    // or in order to be synchronised with the draw cyle when 
                    // the draggable component will become visible again.
                    // Plus it allows the receiver to perform any necessary clean-up. 
                    return void 0;
                } else {
                    this._draggingOperationContext = null;
                }
            }

            this._removeDraggablePlaceholderIfNeeded();
        }
    },

    _drawDraggedImageIfNeeded: {
        value: function (draggedImage) {
            var draggingOperationContext = this._draggingOperationContext;

            if (!draggedImage.parentElement) {
                var draggedImageBoundingRect = this._draggedImageBoundingRect,
                    top = 0, left = 0;
                draggedImage.style.width = draggedImageBoundingRect.width + PX;
                draggedImage.style.height = draggedImageBoundingRect.height + PX;


                if (draggingOperationContext.dataTransfer.dragImageXOffset !== null) {
                    left = draggingOperationContext.startPositionX;

                    if (draggingOperationContext.dataTransfer.dragImageXOffset > draggedImageBoundingRect.width) {
                        left -= draggedImageBoundingRect.width;
                    } else {
                        left -= draggingOperationContext.dataTransfer.dragImageXOffset;
                    }

                } else {
                    left = draggedImageBoundingRect.left;
                }

                if (draggingOperationContext.dataTransfer.dragImageXOffset !== null) {
                    top = draggingOperationContext.startPositionY;

                    if (draggingOperationContext.dataTransfer.dragImageYOffset > draggedImageBoundingRect.height) {
                        top -= draggedImageBoundingRect.height;
                    } else {
                        top -= draggingOperationContext.dataTransfer.dragImageYOffset;
                    }
                } else {
                    top = draggedImageBoundingRect.top;
                }

                top += PX;
                left += PX;

                draggedImage.style.top = top;
                draggedImage.style.left = left;

                if (draggingOperationContext.dragEffect === "move") {
                    var draggableElement = draggingOperationContext.draggable.element;
                    this._oldDraggableDisplayStyle = draggableElement.style.display;
                    draggableElement.style.display = 'none'; 

                    if (draggingOperationContext.showPlaceholder) {
                        var placeholderElement = document.createElement('div'),
                            width = draggedImageBoundingRect.width + PX,
                            height = draggedImageBoundingRect.height + PX;

                        placeholderElement.style.width = width;
                        placeholderElement.style.height = height;
                        placeholderElement.style.boxSizing = "border-box";
                        placeholderElement.classList.add(
                            'montage-drag-placeholder'
                        );

                        draggableElement.parentNode.insertBefore(
                            placeholderElement, 
                            draggableElement
                        );

                        this._placeholderElement = placeholderElement;
                    }
                }

                document.body.appendChild(draggedImage);
                this._needsToWaitforDraggedImageBoundaries = true;
            }
        }
    },

    _removeDraggablePlaceholderIfNeeded: {
        value: function () {
            if (this._shouldRemovePlaceholder) {
                var draggingOperationContext = this._draggingOperationContext;
                this._draggingOperationContext = null;
                this._shouldRemovePlaceholder = false;

                if (draggingOperationContext && draggingOperationContext.draggable) {
                    var draggableElement = draggingOperationContext.draggable.element;
                    draggableElement.style.display = this._oldDraggableDisplayStyle; 
    
                    if (draggingOperationContext.showPlaceholder) {
                        draggableElement.parentNode.removeChild(
                            this._placeholderElement
                        );
                    }
                }
            }
        }
    },

    _scrollIfNeeded: {
        value: function (positionX, positionY) {
            var element = document.elementFromPoint(positionX, positionY),
                containerBoundingRect = this._draggableContainerBoundingRect,
                scrollThreshold = this._scrollThreshold,
                stopSearchingX = false,
                stopSearchingY = false, 
                rect, height, width, top, bottom, right, left, scrollWidth,
                scrollLeft, scrollHeight, scrollTop, outsideBoundariesCounter,
                notScrollable;

            while (element) {
                rect = element.getBoundingClientRect();
                height = rect.height;
                width = rect.width;
                
                if (
                    (!height || !width) || 
                    ((notScrollable = (scrollHeight = element.scrollHeight) <= height)) || 
                    (notScrollable && (scrollWidth = element.scrollWidth) <= width)
                ) {
                    // if no height or width 
                    // or not scrollable pass to to the next parent.
                    element = element.parentElement;
                    continue;
                }

                top = rect.top;
                bottom = rect.bottom;
                left = rect.left;
                right = rect.right;
                outsideBoundariesCounter = 0;
                stopSearchingY = false;

                // Check for horizontal scroll up
                if (
                    positionY >= top && 
                    (!containerBoundingRect || positionY >= containerBoundingRect.top)
                ) {
                    if (positionY <= top + scrollThreshold) {
                        scrollTop = element.scrollTop;

                        // if not already reached the bottom edge
                        if (scrollTop) {
                            element.scrollTop = (
                                scrollTop - 
                                this._getScrollMultiplier(positionY - top)
                            );

                            this._rootComponent.needsDraw = true;
                        }

                        stopSearchingY = true;
                    } else {
                        outsideBoundariesCounter++;
                    }
                } else {
                    outsideBoundariesCounter++;
                }

                // Check for horizontal scroll down
                if (
                    !stopSearchingY && positionY <= bottom && 
                    (!containerBoundingRect || positionY <= containerBoundingRect.bottom)
                ) {
                    if (positionY >= bottom - scrollThreshold) {
                        scrollTop = element.scrollTop;

                        // if not already reached the bottom edge
                        if (scrollTop < scrollHeight) {
                            element.scrollTop = (
                                scrollTop + 
                                this._getScrollMultiplier(bottom - positionY)
                            );
                            this._rootComponent.needsDraw = true;
                        }

                        stopSearchingY = true;
                    } else {
                        outsideBoundariesCounter++;
                    }
                } else {
                    outsideBoundariesCounter++;
                }

                // Check for vertical scroll left
                if (
                    positionX >= left && 
                    (!containerBoundingRect || positionX >= containerBoundingRect.left)
                ) {
                    if (positionX <= left + scrollThreshold) {
                        scrollLeft = element.scrollLeft;

                        // if not already reached the left edge
                        if (scrollLeft) {
                            element.scrollLeft = (
                                scrollLeft - 
                                this._getScrollMultiplier(positionX - left)
                            );

                            this._rootComponent.needsDraw = true;
                        }

                        stopSearchingX = true;
                    } else {
                        outsideBoundariesCounter++;
                    }
                } else {
                    outsideBoundariesCounter++;
                }

                // Check for horizontal scroll right
                if (
                    !stopSearchingX && positionX <= right && 
                    (!containerBoundingRect || positionX <= containerBoundingRect.right)
                ) {
                    if (positionX >= right - scrollThreshold) {
                        scrollLeft = element.scrollLeft;
                        scrollWidth = scrollWidth || element.scrollWidth;

                        // if not already reached the right edge
                        if (scrollLeft < scrollWidth) {   
                            element.scrollLeft = (
                                scrollLeft + 
                                this._getScrollMultiplier(right - positionX)
                            );
                            this._rootComponent.needsDraw = true;
                        }

                        stopSearchingX = true;
                    } else {
                        outsideBoundariesCounter++;
                    }
                } else {
                    outsideBoundariesCounter++;
                }

                if (stopSearchingY || stopSearchingX ||
                    outsideBoundariesCounter === 4
                ) {
                    element = null;
                } else {
                    element = element.parentElement;
                }
            }
        }
    },

    _getScrollMultiplier: {
        value: function (delta) {
            return (this._scrollThreshold / (delta >= 1 ? delta : 1)) * 4;
        }
    }

});

DragManager.prototype.captureMSPointerDown = DragManager.prototype.capturePointerdown;
DragManager.prototype.captureMSPointerMove = DragManager.prototype.capturePointermove;
