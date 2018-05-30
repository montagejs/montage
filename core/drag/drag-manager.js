var Montage = require("../core").Montage,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    DraggingOperationInfo = require("./dragging-operation-info").DraggingOperationInfo;

var DRAG_OPERATION = 0;
var DROP_OPERATION = 1;

var DragManager = exports.DragManager = Montage.specialize({

    __draggingSources: {
        value: null
    },

    _draggingSources: {
        get: function () {
            return this.__draggingSources || (this.__draggingSources = []);
        }
    },

    __droppingDestinations: {
        value: null
    },

    _droppingDestinations: {
        get: function () {
            return this.__droppingDestinations || (this.__droppingDestinations = []);
        }
    },

    __rootComponent: {
        value: null
    },

    _rootComponent: {
        set: function (component) {
            if (this.__rootComponent !== component) {
                if (this.__rootComponent) {
                    this.__rootComponent.removeComposer(this._translateComposer);
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

    _TOUCH_POINTER: {
        value: "touch",
        writable: false
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

    _needsToWaitforGhostElementBoundaries: {
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

            return this;
        }
    },

    registerForDragSource: {
        value: function (component) {
            this._register(component, DRAG_OPERATION);
        }
    },

    registerForDragDestination: {
        value: function (component) {
            this._register(component, DROP_OPERATION);
        }
    },

    unregisterForDragSource: {
        value: function (component) {
            this._unregister(component, DRAG_OPERATION);
        }
    },

    unregisterForDragDestination: {
        value: function (component) {
            this._unregister(component, DROP_OPERATION);
        }
    },

    _register: {
        value: function (component, operationType) {
            if (component) {
                var components = operationType === DRAG_OPERATION ? 
                    this._draggingSources : this._droppingDestinations;

                if (components.indexOf(component) === -1) {
                    components.push(component);
                }
            }
        }
    },

    _unregister: {
        value: function (component, operationType) {
            if (component) {
                var components = operationType === DRAG_OPERATION ? 
                    this._draggingSources : this._droppingDestinations,
                    index;

                if ((index = components.indexOf(component)) > -1) {
                    components.splice(index, 1);
                }
            }
        }
    },

    _createDraggingOperationInfoWithSourceAndPosition: {
        value: function (source, startPosition) {
            var draggingOperationInfo = new DraggingOperationInfo(),
                draggingImage = source.element.cloneNode(true);
            
            draggingImage.classList.add("montage-dragging-image");
            draggingImage.style.visibility = "hidden";
            draggingImage.style.position = "absolute";
            draggingImage.style.pointerEvents = "none";
            draggingImage.style.boxSizing = "border-box";
            draggingImage.style.zIndex = 999999;
            draggingImage.style.opacity = 0.95;

            draggingOperationInfo.source = source;
            draggingOperationInfo.draggingImage = draggingImage;
            draggingOperationInfo.startPositionX = startPosition.pageX;
            draggingOperationInfo.startPositionY = startPosition.pageY;
            draggingOperationInfo.positionX = startPosition.pageX;
            draggingOperationInfo.positionY = startPosition.pageY;

            return draggingOperationInfo;
        }
    },

    _dispatchDraggingOperationStart: {
        value: function (draggingOperationInfo) {
            var component;
            
            for (var i = 0, length = this._droppingDestinations.length; i < length; i++) {
                component = this._droppingDestinations[i];
                component._draggingStarted(draggingOperationInfo);
            }
        }
    },

    _dispatchDraggingOperationEnd: {
        value: function (draggingOperationInfo) {
            var component;
            
            for (var i = 0, length = this._droppingDestinations.length; i < length; i++) {
                component = this._droppingDestinations[i];
                component._draggingEnded(draggingOperationInfo);
            }
        }
    },

    _notifyDroppingDestinationToPerformDropOperation: {
        value: function (draggingOperationInfo) {
            if (this._droppingDestination) {
                this._droppingDestination._performDropOperation(
                    draggingOperationInfo
                );
            }
        }
    },

    _notifyDroppingDestinationToConcludeDropOperation: {
        value: function (draggingOperationInfo) {
            if (this._droppingDestination) {
                this._droppingDestination._concludeDropOperation(
                    draggingOperationInfo
                );
            }
        }
    },

    _notifyDroppingDestinationDraggingImageHasEntered: {
        value: function (draggingOperationInfo) {
            if (this._droppingDestination) {
                this._droppingDestination._draggingEntered(
                    draggingOperationInfo
                );
            }
        }
    },

    _notifyDroppingDestinationDraggingImageHasUpdated: {
        value: function (draggingOperationInfo) {
            if (this._droppingDestination) {
                this._droppingDestination._draggingUpdated(
                    draggingOperationInfo
                );
            }
        }
    },

    _notifyDroppingDestinationDraggingImageHasExited: {
        value: function (draggingOperationInfo) {
            if (this._droppingDestination) {
                this._droppingDestination._draggingExited(
                    draggingOperationInfo
                );
            }
        }
    },

    _findDraggingSourceAtPosition: {
        value: function (positionX, positionY) {
            return this._findRegisteredComponentAtPosistion(
                positionX,
                positionY, 
                DRAG_OPERATION
            );
        }
    },

    _findDropDestinationAtPosition: {
        value: function (positionX, positionY) {
            var droppingDestination = this._findRegisteredComponentAtPosistion(
                positionX,
                positionY, 
                DROP_OPERATION
            );

            return droppingDestination && droppingDestination.acceptDragOperation ? 
                droppingDestination : null;
        }
    },

    _findRegisteredComponentAtPosistion: {
        value: function (positionX, positionY, operationType) {
            var targetComponent = this._findComponentAtPosition(positionX, positionY),
                registeredComponent;

            if (targetComponent) {
                var registeredComponents = operationType === DRAG_OPERATION ? 
                    this._draggingSources : this._droppingDestinations,
                    index;

                while (targetComponent) {
                    if ((index = registeredComponents.indexOf(targetComponent)) > -1) {
                        registeredComponent = registeredComponents[index];
                        targetComponent = null;
                    } else {
                        targetComponent = targetComponent.parentComponent;
                    }
                }
            }

            return registeredComponent;
        }
    },

    _findComponentAtPosition: {
        value: function (positionX, positionY) {
            var element = document.elementFromPoint(positionX, positionY),
                component;

            if (element) {
                while (element && !(component = element.component)) {
                    element = element.parentElement;
                }
            }

            return component;
        }
    },

    _addTranslateListeners: {
        value: function () {
            this._translateComposer.addEventListener('translate', this);
            this._translateComposer.addEventListener('translateEnd', this);
            this._translateComposer.addEventListener('translateCancel', this);
        }
    },

    _removeTranslateListeners: {
        value: function () {
            this._translateComposer.removeEventListener('translate', this);
            this._translateComposer.removeEventListener('translateEnd', this);
            this._translateComposer.removeEventListener('translateCancel', this);
        }
    },

    _resetTranslateContext: {
        value: function () {
            this._removeTranslateListeners();
            this._isDragging = false;
            this.__translateComposer.translateX = 0;
            this.__translateComposer.translateY = 0;
            this._draggingImageBoundingRect = null;
            this._willTerminateDraggingOperation = false;
            this._needsToWaitforGhostElementBoundaries = false;
        }
    },

    capturePointerdown: {
        value: function (event) {
            if (event.pointerType === this._TOUCH_POINTER || 
                (window.MSPointerEvent && event.pointerType === window.MSPointerEvent.MSPOINTER_TYPE_TOUCH)
            ) {
                this.captureTouchstart(event);
            }
        }
    },

    captureTouchstart: {
        value: function (event) {
            var sourceComponent = this._findDraggingSourceAtPosition(
                event.pageX,
                event.pageY
            );

            if (sourceComponent) {
                if (window.PointerEvent) {
                    this._rootComponent.element.addEventListener("pointermove", this, true);
                } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                    this._rootComponent.element.addEventListener("MSPointerMove", this, true);
                } else {
                    this._rootComponent.element.addEventListener("touchmove", this, true);
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
                this._rootComponent.element.removeEventListener("pointermove", this, true);
            } else if (window.MSPointerEvent && window.navigator.msPointerEnabled) {
                this._rootComponent.element.removeEventListener("MSPointerMove", this, true);
            } else {
                this._rootComponent.element.removeEventListener("touchmove", this, true);
            }
        }
    },

    handleTranslateStart: {
        value: function (event) {
            var startPosition = this._translateComposer.pointerStartEventPosition,
                sourceComponent = this._findDraggingSourceAtPosition(
                    startPosition.pageX,
                    startPosition.pageY
                );

            if (sourceComponent) {
                this._draggingOperationInfo = this._createDraggingOperationInfoWithSourceAndPosition(
                    sourceComponent, 
                    startPosition
                );

                this._draggingOperationInfo.draggingOperationType = (
                    sourceComponent.draggingOperationType || DragManager.DragOperationCopy
                );

                sourceComponent._beginDraggingOperation(this._draggingOperationInfo);
                this._dispatchDraggingOperationStart(this._draggingOperationInfo);
                this._isDragging = true;
                this._rootComponent.needsDraw = true;
                this._addTranslateListeners();
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

            var droppingDestination = this._findDropDestinationAtPosition(
                this._draggingOperationInfo.positionX,
                this._draggingOperationInfo.positionY
            );      
            
            this._draggingOperationInfo.source._updateDraggingOperation(
                this._draggingOperationInfo
            );

            if (droppingDestination !== this._droppingDestination) {
                if (this._droppingDestination) {
                    this._notifyDroppingDestinationDraggingImageHasExited();
                }

                if (droppingDestination) {
                    this._notifyDroppingDestinationDraggingImageHasEntered();
                }
            } else if (droppingDestination) {
                this._notifyDroppingDestinationDraggingImageHasUpdated();
            }

            this._droppingDestination = droppingDestination;

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
            this._droppingDestination = null;
            this._willTerminateDraggingOperation = true;
            this._rootComponent.needsDraw = true;
        }
    },

    willDraw: { 
        value: function () {
            if (this._isDragging && this._draggingOperationInfo && !this._draggingImageBoundingRect) {
                this._draggingImageBoundingRect = this._draggingOperationInfo.source.element.getBoundingClientRect();
            }
        }
    },

    draw: {
        value: function () {
            var draggingOperationInfo = this._draggingOperationInfo;

            if (this._isDragging && !this._willTerminateDraggingOperation) {
                var draggingImage = draggingOperationInfo.draggingImage;

                if (!draggingImage.parentElement) {
                    draggingImage.style.top = this._draggingImageBoundingRect.top + "px";
                    draggingImage.style.left = this._draggingImageBoundingRect.left + "px";
                    draggingImage.style.width = this._draggingImageBoundingRect.width + "px";
                    draggingImage.style.height = this._draggingImageBoundingRect.height + "px";
                    document.body.appendChild(draggingImage);

                    if (draggingOperationInfo.draggingOperationType === DragManager.DragOperationMove) {
                        this._oldSourceDisplayStyle = draggingOperationInfo.source.element.style.display;
                        draggingOperationInfo.source.element.style.display = 'none'; 

                        if (draggingOperationInfo.draggingSourcePlaceholderStrategy === DragManager.DraggingSourcePlaceholderStrategyVisible) {
                            this._placeholderElement = document.createElement('div');
                            this._placeholderElement.style.width = this._draggingImageBoundingRect.width + "px";
                            this._placeholderElement.style.height = this._draggingImageBoundingRect.height + "px";
                            this._placeholderElement.style.boxSizing = "border-box";
                            this._placeholderElement.classList.add('montage-placeholder');

                            draggingOperationInfo.source.element.parentNode.insertBefore(
                                this._placeholderElement, 
                                draggingOperationInfo.source.element
                            );
                        }
                    }

                    this._needsToWaitforGhostElementBoundaries = true;
                }

                if (!this._needsToWaitforGhostElementBoundaries) {
                    draggingImage.style.visibility = "visible";
                } else {
                    this._needsToWaitforGhostElementBoundaries = false;
                }

                draggingImage.style[DragManager.cssTransform] = "translate3d(" +
                    this._draggingOperationInfo.deltaX + "px," + 
                    this._draggingOperationInfo.deltaY + "px,0)";

                if (this._droppingDestination && 
                    draggingOperationInfo.draggingOperationType === DragManager.DragOperationCopy
                ) {
                    this._rootComponent.element.style.cursor = 'copy';
                } else {
                    this._rootComponent.element.style.cursor = 'move';
                }
            } else if (this._willTerminateDraggingOperation) {
                this._rootComponent.element.style.cursor = 'default';
                document.body.removeChild(draggingOperationInfo.draggingImage);

                if (this._droppingDestination) {
                    draggingOperationInfo.hasBeenDrop = true;
                }

                this._notifyDroppingDestinationToPerformDropOperation(
                    draggingOperationInfo
                );
                
                this._resetTranslateContext();
                
                this._notifyDroppingDestinationToConcludeDropOperation(
                    draggingOperationInfo
                );

                this._droppingDestination = null;

                draggingOperationInfo.source._endDraggingOperation(draggingOperationInfo);

                this._dispatchDraggingOperationEnd(
                    draggingOperationInfo
                );

                if (draggingOperationInfo.draggingOperationType === DragManager.DragOperationMove) {
                    this._shouldRemovePlaceholder = true;
                    this._rootComponent.needsDraw = true;
                    // Wait for the next draw cycle to remove the placeholder,
                    // allowing the receiver to perform any necessary clean-up. 
                    return void 0;
                }
            }

            if (this._shouldRemovePlaceholder) {
                draggingOperationInfo.source.element.style.display = this._oldSourceDisplayStyle; 

                if (draggingOperationInfo.draggingSourcePlaceholderStrategy === DragManager.DraggingSourcePlaceholderStrategyVisible) {
                    draggingOperationInfo.source.element.parentNode.removeChild(
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

    DraggingSourcePlaceholderStrategyHidden: {
        value: 0
    },

    DraggingSourcePlaceholderStrategyVisible: {
        value: 1
    }

});

DragManager.prototype.captureMSPointerDown = DragManager.prototype.capturePointerdown;
DragManager.prototype.captureMSPointerMove = DragManager.prototype.capturePointermove;
