/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module montage/core/event/binding
    @requires montage/core/core
    @requires montage/core/event/mutable-event
    @requires montage/core/serializer
    @requires montage/core/deserializer
    @requires montage/core/event/event-manager
*/

var Montage = require("montage").Montage,
    ChangeEventConstructor = require("core/event/mutable-event")._Change,
    ChangeTypes = require("core/event/mutable-event").ChangeTypes,
    Serializer = require("core/serializer").Serializer,
    Deserializer = require("core/deserializer").Deserializer,
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    AT_TARGET = 2;

/**
    @member external:Array#dispatchChangeEvent
*/
Object.defineProperty(Array.prototype, "dispatchChangeEvent", {value: false, enumerable: false, writable: true});

/**
    @member external:Array#dispatchChangeAtIndexEvent
*/
Object.defineProperty(Array.prototype, "dispatchChangeAtIndexEvent", {value: false, enumerable: false, writable: true});

/**
    @member external:Array#dispatchChangeAtLengthEvent
*/
Object.defineProperty(Array.prototype, "dispatchChangeAtLengthEvent", {value: false, enumerable: false, writable: true});

/**
    @class module:montage/core/event/binding.ChangeEventDispatchingArray
*/
var ChangeEventDispatchingArray = exports.ChangeEventDispatchingArray = [];

/**
    @function external:Array#addContentEventListener
    @param {string} type Event type
    @param {object|function} listener Event listener.
    @param {boolean} useCapture Specifies whether to listen for the event during the capture phase.
*/
Object.defineProperty(Array.prototype, "addContentEventListener", {
    value: function(type, listener, useCapture) {
    },
    enumerable: false,
    configurable: true
});


Object.defineProperty(ChangeEventDispatchingArray, "_splice", {
    value: Array.prototype.splice,
    enumerable: false,
    configurable: true
});

/**
    @function module:montage/core/event/binding.ChangeEventDispatchingArray#splice
    @param {string} type Event type
    @param {object|function} listener Event listener.
    @param {boolean} useCapture Specifies whether to listen for the event during the capture phase.
*/
Object.defineProperty(ChangeEventDispatchingArray, "splice", {
    value: function(index, howMany/*[, element1[, ...[, elementN]]]*/) {

        var originalCount = this.length,
            addedCount = arguments.length - 2, /* elements to add less the index and howMany parameters*/
            removedCount,
            netChange,
            i, changeType, changeEvent, affectedIndexCount, startIndex, changeIndex,
            removedMembers,
            addedMembers = [];

        if (addedCount > 0) {
            addedMembers = this.slice.call(arguments, 2);
        }

        // Index may be positive (from the front) or negative (from the back) figure out the positive one
        // now in anticipation of needing it when dispatching events
        startIndex = index >= 0 ? index : this.length + index;
        removedMembers = this._splice.apply(this, arguments);
        removedCount = removedMembers.length;

        netChange = addedCount - removedCount;

        // Find the most accurate propertyChange type for this splice,
        // For the most part it's considered a modification unless the length of the array was modified
        // if only to not bother notifying listeners for changes of the length of this array
        changeType = ChangeTypes.MODIFICATION;

        if (netChange > 0) {
            changeType = ChangeTypes.ADDITION;
        } else if (netChange < 0) {
            changeType = ChangeTypes.REMOVAL;
        }

        if (this.dispatchChangeEvent) {
            changeEvent = new ChangeEventConstructor();
            changeEvent.minus = removedMembers;
            changeEvent.plus = addedMembers;
            changeEvent.changeIndex = index;
            changeEvent.propertyChange = changeType;
            this.dispatchEvent(changeEvent);
        }

        if (this.dispatchChangeAtIndexEvent) {

            if (typeof howMany === "undefined") {
                // no howMany argument given: remove all elements after index?
                // TODO this may only be in some implementations
                affectedIndexCount = originalCount + addedCount;
            } else if (0 === netChange) {
                // No net change; affects only how many expected
                affectedIndexCount = addedCount;
            } else if (netChange > 0) {
                // Net gain; affects from start to end of original array + net gain
                affectedIndexCount = (originalCount - startIndex) + (netChange);
            } else {
                // Net loss; affects from start to end of original array
                affectedIndexCount = originalCount - startIndex;
            }

            for (i = 0; i < affectedIndexCount; i++) {
                changeIndex = startIndex + i;

                changeEvent = new ChangeEventConstructor();
                changeEvent.type = "change@" + changeIndex;

                // old value at changeIndex was either:
                // - removed outright, or replaced
                // - moved somewhere in the array due to a gain or loss
                changeEvent.minus = (i < removedCount) ? removedMembers[i] : this[changeIndex + netChange];

                changeEvent.plus = this[changeIndex];
                changeEvent.changeIndex = changeIndex;
                changeEvent.propertyChange = changeType;
                this.dispatchEvent(changeEvent);
            }
        }

        return removedMembers;
    },
    enumerable: false,
    configurable: true
});
//Removes the first element from an array and returns that element. This method changes the length of the array.
Object.defineProperty(ChangeEventDispatchingArray, "_shift", {
    value: Array.prototype.shift,
    enumerable: false,
    configurable: true
});

/**
    @function module:montage/core/event/binding.ChangeEventDispatchingArray#shift
*/
Object.defineProperty(ChangeEventDispatchingArray, "shift", {
    value: function() {

        if (0 === this.length) {
            return;
        }

        var result, i, countI, changeEvent;

        result = this._shift.call(this);

        if (this.dispatchChangeEvent) {
            changeEvent = new ChangeEventConstructor();
            changeEvent.minus = result;
            changeEvent.plus = this[0];
            changeEvent.changeIndex = 0;
            changeEvent.propertyChange = ChangeTypes.REMOVAL;
            this.dispatchEvent(changeEvent);
        }

        if (this.dispatchChangeAtIndexEvent) {
            // A single item was just removed form the front; notify all index listeners
            // (including listeners for the index that is now undefined at the end)
            for (i = 0,countI = this.length + 1; i < countI; i++) {
                changeEvent = new ChangeEventConstructor();
                changeEvent.type = "change@" + i;
                changeEvent.minus = i === 0 ? result : this[i - 1];
                changeEvent.plus = this[i];
                changeEvent.changeIndex = i;
                changeEvent.propertyChange = ChangeTypes.REMOVAL;
                this.dispatchEvent(changeEvent);
            }
        }
        return result;
    },
    enumerable: false,
    configurable: true
});

//Adds one or more elements to the beginning of an array and returns the new length of the array.
Object.defineProperty(ChangeEventDispatchingArray, "_unshift", {
    value: Array.prototype.unshift,
    enumerable: false,
    configurable: true
});

/**
    @function module:montage/core/event/binding.ChangeEventDispatchingArray#unshift
*/
Object.defineProperty(ChangeEventDispatchingArray, "unshift", {
    value: function() {

        var addedCount = arguments.length, i, countI, changeEvent;

        countI = this._unshift.apply(this, arguments);

        if (this.dispatchChangeEvent) {
            changeEvent = new ChangeEventConstructor();
            changeEvent.minus = undefined;
            changeEvent.plus = Array.prototype.slice.call(arguments, 0);
            changeEvent.changeIndex = 0;
            changeEvent.propertyChange = ChangeTypes.ADDITION;
            this.dispatchEvent(changeEvent);
        }

        if (this.dispatchChangeAtIndexEvent) {
            for (i = 0; i < countI; i++) {
                changeEvent = new ChangeEventConstructor();
                changeEvent.type = "change@" + (i);
                changeEvent.minus = this[addedCount + i];
                changeEvent.plus = this[i];
                changeEvent.changeIndex = i;
                changeEvent.propertyChange = ChangeTypes.ADDITION;
                this.dispatchEvent(changeEvent);
            }
        }

    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(ChangeEventDispatchingArray, "_reverse", {
    value: Array.prototype.reverse,
    enumerable: false,
    configurable: true
});

/**
    @function module:montage/core/event/binding.ChangeEventDispatchingArray#reverse
*/
Object.defineProperty(ChangeEventDispatchingArray, "reverse", {
    value: function() {

        // There's really no point in reversing an empty array or an array of a single member
        if (this.length <= 1) {
            return this;
        }

        var i, countI = this.length, changeEvent;

        this._reverse.apply(this, arguments);

        if (this.dispatchChangeEvent) {
            changeEvent = new ChangeEventConstructor();
            changeEvent.minus = null;
            changeEvent.plus = this;
            changeEvent.changeIndex = 0;
            changeEvent.propertyChange = ChangeTypes.MODIFICATION;
            this.dispatchEvent(changeEvent);
        }

        if (this.dispatchChangeAtIndexEvent) {
            for (i = 0; i < countI; i++) {
                changeEvent = new ChangeEventConstructor();
                changeEvent.type = "change@" + i;
                changeEvent.minus = this[(this.length - 1) - i];
                changeEvent.plus = this[i];
                changeEvent.changeIndex = i;
                changeEvent.propertyChange = ChangeTypes.MODIFICATION;
                this.dispatchEvent(changeEvent);
            }
        }

        return this;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(ChangeEventDispatchingArray, "_push", {
    value: Array.prototype.push,
    enumerable: false,
    configurable: true
});

/**
    @function module:montage/core/event/binding.ChangeEventDispatchingArray#push
*/
Object.defineProperty(ChangeEventDispatchingArray, "push", {
    value: function() {

        var mutationStartIndex = this.length,
            addedCount = arguments.length,
            i,
            changeEvent;

        this._push.apply(this, arguments);

        if (this.dispatchChangeEvent) {
            changeEvent = new ChangeEventConstructor();
            changeEvent.plus = Array.prototype.slice.call(arguments, 0);
            changeEvent.minus = undefined;
            changeEvent.changeIndex = mutationStartIndex;
            changeEvent.propertyChange = ChangeTypes.ADDITION;
            this.dispatchEvent(changeEvent);
        }

        if (this.dispatchChangeAtIndexEvent) {
            //Tell what happened
            for (i = 0; i < addedCount; i++) {
                changeEvent = new ChangeEventConstructor();
                changeEvent.type = "change@" + (mutationStartIndex + i);
                changeEvent.minus = undefined;
                changeEvent.plus = arguments[i];
                changeEvent.changeIndex = i;
                changeEvent.propertyChange = ChangeTypes.ADDITION;
                this.dispatchEvent(changeEvent);
            }
        }

    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(ChangeEventDispatchingArray, "_pop", {
    value: Array.prototype.pop,
    enumerable: false,
    configurable: true
});

/**
    @function module:montage/core/event/binding.ChangeEventDispatchingArray#pop
*/
Object.defineProperty(ChangeEventDispatchingArray, "pop", {
    value: function() {

        if (this.length === 0) {
            return;
        }

        var result,
            changeEvent,
            changeIndex = this.length - 1;

        result = this._pop.call(this);

        if (this.dispatchChangeEvent) {
            changeEvent = new ChangeEventConstructor();
            changeEvent.minus = result;
            changeEvent.plus = undefined;
            changeEvent.changeIndex = changeIndex;
            changeEvent.propertyChange = ChangeTypes.REMOVAL;
            this.dispatchEvent(changeEvent);
        }

        if (this.dispatchChangeAtIndexEvent) {
            //Tell what happened on that specific index
            changeEvent = new ChangeEventConstructor();
            changeEvent.type = "change@" + changeIndex;
            changeEvent.minus = result;
            changeEvent.plus = undefined;
            changeEvent.changeIndex = changeIndex;
            changeEvent.propertyChange = ChangeTypes.REMOVAL;
            this.dispatchEvent(changeEvent);
        }
        return result;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(ChangeEventDispatchingArray, "_sort", {
    value: Array.prototype.sort,
    enumerable: false,
    configurable: true
});

/**
    @function module:montage/core/event/binding.ChangeEventDispatchingArray#sort
*/
Object.defineProperty(ChangeEventDispatchingArray, "sort", {
    value: function() {
        var i, countI = this.length, copy = this.slice(), changeEvent;

        this._sort.apply(this, arguments);

        if (this.dispatchChangeEvent) {
            changeEvent = new ChangeEventConstructor();
            changeEvent.minus = null;
            changeEvent.plus = this;
            changeEvent.changeIndex = 0;
            changeEvent.propertyChange = ChangeTypes.MODIFICATION;
            this.dispatchEvent(changeEvent);
        }

        if (this.dispatchChangeAtIndexEvent) {
            for (i = 0; i < countI; i++) {

                // Don't emit an event for an index that was not affected by the sort
                if (copy[i] === this[i]) {
                    continue;
                }

                changeEvent = new ChangeEventConstructor();
                changeEvent.type = "change@" + i;
                changeEvent.minus = copy[i];
                changeEvent.plus = this[i];
                changeEvent.changeIndex = i;
                changeEvent.propertyChange = ChangeTypes.MODIFICATION;
                this.dispatchEvent(changeEvent);
            }
        }

        return this;
    },
    enumerable: false,
    configurable: true
});

/**
    @function external:Object#automaticallyDispatchEvent
    @param {string} eventType
*/
Object.defineProperty(Object.prototype, "automaticallyDispatchEvent", {
    value: function(eventType) {
        return eventType.indexOf("change") === 0;
    },
    enumerable: false,
    configurable: true
});

/**
    @class module:montage/core/event/binding.PropertyChangeBindingListener
    @extends module:montage/core/core.Montage
*/
var PropertyChangeBindingListener = exports.PropertyChangeBindingListener = Object.create(Montage, /** module:montage/core/event/binding.PropertyChangeBindingListener# */ {

    useCapture: {value:false, writable: true},
    target: {value: null, writable: true},
    originalListener: {value: null, writable: true},
    originalListenerIsFunction: {value: false, writable: true},
    targetPropertyPath: {value: null, writable: true},
    //This is added for bindings, but could be used for addEventListener for property change as well
    /*
     * bindingOriginValueDeferred specifies wether an update to the value of bindingOrigin is pushed automatically or on-demand.
     */
    bindingOriginValueDeferred: {value:false, writable: true},
    /*
     * deferredValue contains the value to push on target when bindingOriginValueDeferred is true.
     */
    deferredValue: {value:null, writable: true},
    /*
     * deferredValueTarget contains the target that should have the deferredValue applied to, its values are "bound" or "target" depending on the direction of the change, or an empty string ("") if no value has been deferred.
     */
    deferredValueTarget: {value:null, writable: true},

    //This is storing the future prevValue
    previousTargetPropertyPathValue: {value: null, writable: true},
    targetPropertyPathCurrentIndex: {value: 0, writable: true},
    currentIndexListenee: {value: null, writable: true},
    bindingOriginCurrentIndexListenee: {value: null, writable: true},
    currentPropertyComponent: {value: null, writable: true},
    bindingOrigin: {value: null, writable: true},
    bindingPropertyPath: {value: null, writable: true},
    bindingPropertyPathCurrentIndex: {value: 0, writable: true},
    bindingDescriptor: {value: null, writable: true},
    applyBindingOriginDeferredValue: {
        value: function() {
            this.bindingOrigin.setProperty(this.bindingPropertyPath, this.deferredValue);
        }
    },
    applyTargetDeferredValue: {
        value: function() {
            this.target.setProperty(this.targetPropertyPath, this.deferredValue);
        }
    },
    applyDeferredValues: {
        value: function() {
            if (this.deferredValueTarget === "bound") {
                this.applyBindingOriginDeferredValue();
            } else if (this.deferredValueTarget === "target") {
                this.applyTargetDeferredValue();
            }
            this.deferredValueTarget = "";
        }
    },
    handleEvent: {value: function(event) {
        var targetPropertyPath = this.targetPropertyPath,
            target = this.target,
            localNewValue = event.plus,
            localPrevValue = event.minus,
            localTarget = event.target,
            type = event.type,
            // changeType = event.propertyChange,
            // localPropertyName = event.propertyName,
            boundObjectValue,
            sourceObjectValue,
            dotIndex,
            nextPathComponent,
            atSignIndex,
            baseType,
            bindingDescriptor,
            bindingOrigin = this.bindingOrigin,
            leftOriginated,
            changeOriginPropertyPath = null,
            exploredPath,
            remainingPath,
            i,
            localPrevValueCount;

        if (target !== bindingOrigin) {
            //the left and the right are different objects; easy enough
            leftOriginated = event.target === bindingOrigin;
        } else {
            //otherwise, they're the same object; time to try and figure out which "side" the event came from
            // TODO this is a very weak check that relies on the bindingOrigin using a property and not a full propertyPath
            leftOriginated = event.propertyName === this.bindingPropertyPath;
        }

        if (leftOriginated) {
            // This change event targeted the left side of the binding; try to push to the right side

            if (!bindingOrigin.setProperty.changeEvent) {

                sourceObjectValue = localNewValue;

                if (this.bindingDescriptor.converter) {
                    sourceObjectValue = this.bindingDescriptor.converter.revert(sourceObjectValue);
                }

                // If this event was triggered by the right-to-left- value push; don't bother setting
                // the value on the left side, that's where all this value changing started
                // (The original right-to-left push installs this changeEvent key on the setProperty function)
                if (this.bindingOriginValueDeferred === true || bindingOrigin._bindingsDisabled) {
                    this.deferredValue = sourceObjectValue;
                    this.deferredValueTarget = "target";
                } else {
                    this.bindingOriginChangeTriggered = true;
                    // Set the value on the RIGHT side now
                    this.target.setProperty(this.targetPropertyPath, sourceObjectValue);
                    this.bindingOriginChangeTriggered = false;
                }
            }

            targetPropertyPath = this.bindingPropertyPath;
            target = bindingOrigin;

        } else if (!this.bindingOriginChangeTriggered) {

            // If we're handling the event at this point we know the right side triggered it, from somewhere inside the observed propertyPath
            // the event target, which just changed, could be any of the objects along the path, but from here on we want to
            // treat the event as "change@fullTargetPropertyPath" so adjust the event we have to reflect that
            if (this.target && targetPropertyPath) {
                event.target = target;
                event.propertyPath = targetPropertyPath;

                event.plus = target.getProperty(targetPropertyPath);

                // If the newValue and the storedPreviousValue are the same, this was a mutation on that object
                // we want to show the prevValue that came along from the event lest we point
                // somebody a reference to the same array as the prevValue and newValue
                if (!Array.isArray(this.previousTargetPropertyPathValue) && event.plus !== this.previousTargetPropertyPathValue) {
                    event.minus = this.previousTargetPropertyPathValue;
                }

            } else {
                // TODO I'm not sure when this would happen..
                event.target = this;
            }

            baseType = event.baseType ? event.baseType : ((atSignIndex = type.indexOf("@")) > 0 ? (targetPropertyPath ? type.substring(0, atSignIndex) : type) : type);
            // The binding listener detected some change along the property path it cared about
            // make sure the event we "dispatch" has the full change@propertyPath eventType
            event.type = "change@" + this.targetPropertyPath;

            //For bindings, start the right-to-left value push
            if (event.target === this.target && this.bindingPropertyPath && bindingOrigin) {
                //console.log("@ % @ % @ % @ % @ % Binding Worked!!");

                boundObjectValue = event.plus;

                if (this.bindingDescriptor.boundValueMutator) {
                    boundObjectValue = this.bindingDescriptor.boundValueMutator(boundObjectValue);
                } else if (this.bindingDescriptor.converter) {
                    boundObjectValue = this.bindingDescriptor.converter.convert(boundObjectValue);
                }

                if (this.bindingOriginValueDeferred === true || bindingOrigin._bindingsDisabled) {
                    this.deferredValue = boundObjectValue;
                    this.deferredValueTarget = "bound";
                } else {
                    // Make the original event available to the setter
                    this.bindingOrigin.setProperty.changeEvent = event;
                    // Set the value on the LEFT side now
                    this.bindingOrigin.setProperty(this.bindingPropertyPath, boundObjectValue);
                    this.bindingOrigin.setProperty.changeEvent = null;
                }
            }
            // Otherwise, there was probably a listener for a change at this path that was not a part of some binding
            // so distribute the event to the original listener
            // TODO this is not as full featured as the EventManager event distribution so it may differ, which is bad
            else if (this.originalListener) {
                if (this.originalListenerIsFunction) {
                    this.originalListener.call(this.target, event);
                } else {
                    this.originalListener.handleEvent(event);
                }
            }

            // Update the stored value of the propertyPath
            this.previousTargetPropertyPathValue = event.plus;

            // TODO I'm not exactly sure why this happens here, or really why it does in general
            event.minus = localPrevValue;
            event.plus = localNewValue;
            event.target = localTarget;

            if (localPrevValue) {

                // Determine where along the property path the change originated from so we know how to build the path
                // to stop observing on things that were removed
                //TODO extract this into a "obj.getPathOfObjectAlongPropertyPath" method or something with proper tests
                exploredPath = "";
                this.target.getProperty(this.targetPropertyPath, null, null, function(value, currentPathComponent, result) {

                    if (changeOriginPropertyPath) {
                        return;
                    }

                    exploredPath += "." + currentPathComponent;

                    if (result === event.target) {
                        changeOriginPropertyPath = exploredPath.replace(/^\./, "");
                    }
                });

                if (changeOriginPropertyPath) {
                    remainingPath = this.targetPropertyPath.replace(new RegExp("^" + changeOriginPropertyPath  + "\.?"), "");
                } else {
                    remainingPath = this.targetPropertyPath;
                }

                // NOTE this check works around Safari not having a removeEventListener on its CanvasPixelArray
                // TODO investigate if this is an appropriate fix or not
                if (typeof localPrevValue.removeEventListener === "function") {
                    localPrevValue.removeEventListener(baseType + "@" + remainingPath, this, this.useCapture);
                }
            }

            if (localNewValue) {
                // Reinstall listeners along the entire propertyPath from the target
                this.target.addEventListener(baseType + "@" + this.targetPropertyPath, this, this.useCapture);
            } else if (event._event.plus) {
                // TODO removing this causes no spec failures; looks suspicious
                this.target.addEventListener(baseType + "@" + this.targetPropertyPath, this, this.useCapture);
            }

        }
        targetPropertyPath = null;
        target = null;
        localNewValue = null;
        localPrevValue = null;
        localTarget = null;
        type = null;
        // changeType = null;
        // localPropertyName = null;
        dotIndex = null;
        nextPathComponent = null;
        atSignIndex = null;
        baseType = null;
        bindingDescriptor = null;
        bindingOrigin = null;
    }
    }

});

/**
    @function external:Object#propertyChangeBindingListener
    @param {string} type The event type to listen for.
    @param {function} listener The event listener object.
    @param {boolean} useCapture Specifies whether to listen for the property change during the capture or bubble event phases.
    @param {object} bindingOrigin The source of the binding.
    @param {string} bindingPropertyPath The key path of the property on the source object.
    @param {object} bindingDescriptor A property descriptor object that specifies the bound object and the bound object property path.
*/
Object.defineProperty(Object.prototype, "propertyChangeBindingListener", {
    value: function(type, listener, useCapture, atSignIndex, bindingOrigin, bindingPropertyPath, bindingDescriptor) {

        var targetPropertyPath, targetPropertyPathCurrentIndex, /*dotIndex,*/
            functionListener = PropertyChangeBindingListener.create();

        if (typeof atSignIndex !== "number") {
            atSignIndex = type.indexOf("@");
        }

        functionListener.useCapture = useCapture;
        functionListener.target = this;
        functionListener.originalListener = listener;
        functionListener.originalListenerIsFunction = (typeof listener === "function");
        if (atSignIndex > -1) {
            functionListener.targetPropertyPath = targetPropertyPath = type.substring(atSignIndex + 1);
            //This is storing the future prevValue
            functionListener.previousTargetPropertyPathValue = this.getProperty(targetPropertyPath);
            functionListener.targetPropertyPathCurrentIndex = targetPropertyPathCurrentIndex = 0;
            if (bindingOrigin) {
                // dotIndex = functionListener.targetPropertyPath.indexOf(".", functionListener.targetPropertyPathCurrentIndex);
                // functionListener.currentPropertyComponent = targetPropertyPath.substring(targetPropertyPathCurrentIndex, (dotIndex === -1 ? targetPropertyPath.length: dotIndex));
                functionListener.bindingOrigin = bindingOrigin;
                functionListener.bindingPropertyPath = bindingPropertyPath;
                functionListener.bindingDescriptor = bindingDescriptor;
                functionListener.bindingOriginValueDeferred = bindingDescriptor.deferred ? true : false;
            }
        }
        return functionListener;
    },
    writable: true
});

/**
    Adds an event listener to the object.
    @function external:Object#addEventListener
    @param {string} type The event type to listen for.
    @param {object | function} listener The listener object or function.
    @param {boolean} useCapture Specifies whether to listen for the event during the bubble or capture phases.
*/
Object.defineProperty(Object.prototype, "addEventListener", {
    value: function addEventListener(type, listener, useCapture) {

        if (!listener) {
            return;
        }

        var atSignIndex = type.indexOf("@"),
            currentPropertyDescriptor,
            setter,
            getter,
            internalStorageProperty,
            prototypeAndDescriptor,
            currentIndexListeneeProperty,
            propertyPath,
            propertyPathCurrentIndex,
            prototypeDefiningProperty,
            currentDispatchingSetterPropertyDescriptor,
            changePropertyPath,
            independentProperty,
            i,
            dependencies,
            dependencyEntry,
            dependencyPropertyPath,
            firstDotIndex;

        // Properly configure the listener and/or target for "change" and "change@foo" events
        if (atSignIndex > 0 || "change" === type) {

            // The listener for a change@ needs to be considered a propertyChangeBindingListener
            // TODO this does seem a little odd seeing as you could just be adding a "change@foo" eventListener outside of bindings
            // so the binding portion of this name is a little misleading
            if (atSignIndex > 0 && (listener.__proto__ || Object.getPrototypeOf(listener)) !== PropertyChangeBindingListener) {
                listener = this.propertyChangeBindingListener(type, listener, useCapture, atSignIndex);
            }

            // In either case, if the eventTarget is an array, it needs to be a ChangeEventDispatchingArray
            // to properly dispatch events (basically all the mutators need to be wrapped)
            if (Array.isArray(this) && this.proto !== ChangeEventDispatchingArray) {
                this.__proto__ = ChangeEventDispatchingArray;
            }

            changePropertyPath = type.replace("change@", "");


        }

        // If this is part of bindings, install the necessary listeners down the entire property path
        // Don't do anything special if it's jsut for "change" though. there's no need to traverse a path
        if ("change" !== type && (listener.__proto__ || Object.getPrototypeOf(listener)) === PropertyChangeBindingListener) {

            // Listening to Left side
            if (changePropertyPath === listener.bindingPropertyPath) {
                currentIndexListeneeProperty = "bindingOriginCurrentIndexListenee";
                propertyPath = listener.bindingPropertyPath;
                propertyPathCurrentIndex = listener.bindingPropertyPathCurrentIndex;
            }
            //Listening to Right side
            else {
                currentIndexListeneeProperty = "currentIndexListenee";
                propertyPath = listener.targetPropertyPath;
                propertyPathCurrentIndex = listener.targetPropertyPathCurrentIndex;
            }

            var visit = function(currentObject, key, value, index) {

                // TODO I've forgotten why the index is passed along. I think we only ever use it when
                // traversing through an array in a property path to indicate we're visiting some member of that collection
                // but we're clearly not using it here; it should probably be removed if we're really never using it

                if (!(typeof currentObject === "function" || typeof currentObject === "object") ||
                    (currentObject.constructor === String && "length" === key)) {
                    // Stop:
                    // if this isn't a function or an object
                    // if we're trying to observe the length of a string (we'll get that from the listener on the string)

                    return;
                }

                if (currentObject._dependenciesForProperty) {
                    dependencies = currentObject._dependenciesForProperty[key];

                    if (dependencies) {
                        dependencyEntry = currentObject._dependencyListeners[key];

                        if (!dependencyEntry) {
                            dependencyEntry = currentObject._dependencyListeners[key] = {
                                observedDependencies: [],
                                listener: null
                            };

                            dependencyEntry.listener = (function(self, key) {
                                return function(event) {
                                    // Ignore events that have reached this dependency listener via capture/bubble distribution
                                    if (AT_TARGET === event.eventPhase) {
                                        var anEvent = document.createEvent("CustomEvent");
                                        anEvent.initCustomEvent("change@" + key, true, false, null);
                                        anEvent.propertyName = key;
                                        self.dispatchEvent(anEvent);
                                    }
                                }
                            })(currentObject, key);
                        }

                        // Ensure we use the dependencyListener to observe all the dependent keys
                        // We can use the same listener for al lof them though as a change at
                        // any independent property is treated as a change at a dependent property
                        for (i = 0; (independentProperty = dependencies[i]); i++) {

                            // Don't double observe a dependency
                            if (dependencyEntry.observedDependencies.indexOf(independentProperty) >= 0) {
                                continue;
                            }

                            currentObject.addEventListener("change@" + independentProperty, dependencyEntry.listener, true);
                            dependencyEntry.observedDependencies.push(independentProperty);
                        }
                    }
                }

                // Operators aren't to be stored
                if (key && key.indexOf("(") > -1) {
                    key = null;
                }

                var type = key ? "change@" + key : "change",
                    currentPropertySetter, enumerable;

                // TODO what does this block really do? I gather its storing the original value...
                if (currentIndexListeneeProperty) {
                    if (!listener[currentIndexListeneeProperty]) {
                        listener[currentIndexListeneeProperty] = {};
                    }
                    if (!listener[currentIndexListeneeProperty][currentObject.uuid]) {
                        listener[currentIndexListeneeProperty][currentObject.uuid] = {};
                    }

                    // TODO was this right?
                    if (key) {
                        listener[currentIndexListeneeProperty][currentObject.uuid][key] = value;
                    }
                }

                // We may have come across an array at this key; make sure we make it a changeDispatchingArray
                // TODO should we have just called AddEventListener from visit to keep this consistent?
                if (Array.isArray(currentObject) && currentObject.proto !== ChangeEventDispatchingArray) {
                    currentObject.__proto__ = ChangeEventDispatchingArray;
                }

                // Now register listeners depending on the target we are trying to observe
                if (currentObject.__proto__ === ChangeEventDispatchingArray) {

                    if (key && !isNaN(key)) {
                        currentObject.dispatchChangeAtIndexEvent = true;
                    } else {
                        currentObject.dispatchChangeEvent = true;
                    }

                    defaultEventManager.registerEventListener(currentObject, type, listener, useCapture);

                } else {

                    // TODO right now we'll install listeners like change@any we probably shouldn't as any is a function,
                    // maybe pass along the string or a function ref to determine whether to add a listener or not?
                    // TODO make any and sum propetyPathOperators, not just array methods? easier to detect?

                    if (defaultEventManager.registerEventListener(currentObject, type, listener, useCapture)) {

                        if (key && currentObject.automaticallyDispatchEvent(type, key)) {

                            prototypeAndDescriptor = Object.getPrototypeAndDescriptorDefiningProperty(currentObject, key);
                            currentPropertyDescriptor = prototypeAndDescriptor.propertyDescriptor;

                            if (currentPropertyDescriptor) {

                                currentPropertySetter = currentPropertyDescriptor.set;
                                getter = currentPropertyDescriptor.get;

                                if (!currentPropertySetter || !currentPropertySetter.isDispatchingSetter) {

                                    //If the property is a value, we need to replace it by a set/get and add a storage.
                                    if ("value" in currentPropertyDescriptor) {

                                        //Create internal storage:
                                        Object.defineProperty(currentObject, (internalStorageProperty = "_" + key), {
                                            value: currentObject.getProperty(key),
                                            configurable: true,
                                            writable: true
                                        });
                                        //Create getter on internal storage:
                                        getter = function getter() {
                                            //console.log("getter for " + getter.storageProperty);
                                            return this[getter.storageProperty];
                                        };

                                        getter.storageProperty = internalStorageProperty;
                                        if (currentObject.hasOwnProperty(key)) {
                                            enumerable = Object.getOwnPropertyDescriptor(currentObject, key).enumerable;
                                        } else {
                                            enumerable = true;
                                        }
                                        delete currentObject[key];
                                        Object.defineProperty(currentObject, key, {get: getter,configurable:true, set: setter, enumerable: enumerable});
                                    }

                                    //Now build the setter, if needed: Do we have it created on our prototype.
                                    prototypeDefiningProperty = prototypeAndDescriptor.prototype;
                                    currentDispatchingSetterPropertyDescriptor = Object.getPropertyDescriptor(prototypeDefiningProperty, "__dispatching_" + key + "_setter");
                                    if (!currentDispatchingSetterPropertyDescriptor || !("value" in currentDispatchingSetterPropertyDescriptor)) {
                                        setter = function setter(value) {

                                            var prevValue = this[setter.property],
                                                anEvent,
                                                acceptedValue;

                                            // we need to actually use the actual setter before assuming this value will be accepted as is
                                            if (setter.storageProperty) {
                                                //if we had a storage property backing what was originally a 'value' property, use it now
                                                this[setter.storageProperty] = value;
                                            } else if (currentPropertySetter) {
                                                // if we had an original setter function, use it now
                                                currentPropertySetter.apply(this, arguments);
                                            }

                                            acceptedValue = this[setter.property];

                                            //if the passed value is the same as the one already on the object, then we shouldn't do anything, for performance reason, as it would be
                                            //a waste of time
                                            if (acceptedValue !== prevValue || ( (prevValue != null) && (prevValue.equals && !prevValue.equals(acceptedValue)))) {
                                                anEvent = document.createEvent("CustomEvent");
                                                anEvent.initCustomEvent("change@" + setter.property, true, false, null);
                                                anEvent.minus = prevValue;
                                                anEvent.plus = acceptedValue;
                                                anEvent.propertyChange = ChangeTypes.MODIFICATION;
                                                anEvent.propertyName = setter.property;
                                                this.dispatchEvent(anEvent);
                                            }
                                        };

                                        setter.storageProperty = internalStorageProperty;
                                        setter.property = key;
                                        setter.isDispatchingSetter = true;
                                        Object.defineProperty(prototypeDefiningProperty, "__dispatching_" + key + "_setter", {
                                            value: setter
                                        });
                                    }
                                    else {
                                        setter = currentDispatchingSetterPropertyDescriptor.value;
                                    }

                                    if (currentObject.hasOwnProperty(key)) {
                                        enumerable = Object.getOwnPropertyDescriptor(currentObject, key).enumerable;
                                    } else {
                                        enumerable = true;
                                    }
                                    delete currentObject[key];
                                    Object.defineProperty(currentObject, key, {
                                        set: setter,
                                        get: getter,
                                        configurable: true,
                                        enumerable: enumerable
                                    });

                                    internalStorageProperty = null;
                                    currentObject = null;
                                }
                            } else {
                                // if there was no property descriptor for this key on this object, how about we add one...
                                // TODO do we want to do this? we need to in one sense or else we'd never be able to observe
                                // keys on an object that didn't exist in the same way that we observe indices that
                                // didn't exist in an array

                                //TODO this is all duplicated from above, clean it up

                                //Create internal storage:
                                Object.defineProperty(currentObject, (internalStorageProperty = "_" + key), {
                                    value: currentObject.getProperty(key),
                                    configurable: true,
                                    writable: true
                                });
                                //Create getter on internal storage:
                                getter = function getter() {
                                    //console.log("getter for " + getter.storageProperty);
                                    return this[getter.storageProperty];
                                };

                                getter.storageProperty = internalStorageProperty;

                                setter = function setter(value) {

                                    var prevValue = this[setter.property],
                                        anEvent,
                                        acceptedValue;

                                    // we need to actually use the actual setter before assuming this value will be accepted as is
                                    if (setter.storageProperty) {
                                        this[setter.storageProperty] = value;
                                    } else {
                                        currentPropertySetter.apply(this, arguments);
                                    }

                                    acceptedValue = this[setter.property];

                                    //if the passed value is the same as the one already on the object, then we shouldn't do anything, for performance reason, as it would be
                                    //a waste of time
                                    if (acceptedValue !== prevValue || ( (prevValue != null) && (prevValue.equals && !prevValue.equals(acceptedValue)))) {
                                        anEvent = document.createEvent("CustomEvent");
                                        anEvent.initCustomEvent("change@" + setter.property, true, false, null);
                                        anEvent.minus = prevValue;
                                        anEvent.plus = acceptedValue;
                                        anEvent.propertyChange = ChangeTypes.MODIFICATION;
                                        anEvent.propertyName = setter.property;
                                        this.dispatchEvent(anEvent);
                                    }
                                };

                                setter.storageProperty = internalStorageProperty;
                                setter.property = key;
                                setter.isDispatchingSetter = true;

                                prototypeDefiningProperty = prototypeAndDescriptor.prototype;
                                if (prototypeDefiningProperty) {
                                    Object.defineProperty(prototypeDefiningProperty, "__dispatching_" + key + "_setter", {
                                        value: setter
                                    });
                                }

                                Object.defineProperty(currentObject, key, {
                                    set: setter,
                                    get: getter,
                                    configurable: true
                                });

                                internalStorageProperty = null;
                                currentObject = null;

                            }
                        }


                    }

                }
            };

            // visit all available objects along the propertyPath
            this.getProperty(propertyPath, null, null, visit, propertyPathCurrentIndex);

        }
        //otherwise, we're not observing a change@aPropertyPath; just install the listener for the given eventType
        else {
            this.dispatchChangeEvent = true;
            defaultEventManager.registerEventListener(this, type, listener, useCapture);
        }

    }
});

/**
    Removes an event listener from the object.
    @function external:Object#removeEventListener
    @param {string} type The event type.
    @param {object | function} listener The listener object or function.
    @param {boolean} useCapture The phase of the event listener.
*/
Object.defineProperty(Object.prototype, "removeEventListener", {
    value: function removeEventListener(type, listener, useCapture) {

        if (!listener) {
            return;
        }

        var atSignIndex = type.indexOf("@"),
            propertyPath;

        // this was a change event listener for some property path, remove listeners along the path
        if (atSignIndex !== -1) {

            propertyPath = type.substring(atSignIndex + 1);

            var visit = function(currentObject, key) {
                if (!key) {
                    return;
                }

                defaultEventManager.unregisterEventListener(currentObject, "change@" + key, listener, useCapture);
            };


            this.getProperty(propertyPath, null, null, visit);

        }
        //otherwise, we're not removing a change@aPropertyPath; just remove the listener for the given eventType
        else {
            this.dispatchChangeEvent = true;
            defaultEventManager.unregisterEventListener(this, type, listener, useCapture);
        }


    }
});

/**
 Binding descriptor keys
 @class module:montage/core/event/binding.BindingDescriptor
 @extends module:montage/core/core.Montage
*/
var BindingDescriptor = exports.BindingDescriptor = Montage.create(Montage, /** @lends module:montage/core/event/binding.BindingDescriptor */ {

/**
 The object sourceObject will be bound to
*/
    boundObject: {
        enumerable: false,
        serializable: true,
        value: null
    },

/**

 The key path of boundObject which sourceObject's sourceObjectBindingPath is bound to

*/
    boundObjectPropertyPath: {
        enumerable: false,
        serializable: true,
        value: null
    },

/**
 Specifies whether the source Object will push value back to it's boundObject's boundObjectPropertyPath or not. Default is false.
*/
    oneway: {
        enumerable: false,
        serializable: true,
        value: null
    },

/**
     If true, PropertyChangeBindingListener will buffer the value until it's told to execute binding. Setting this value to false allows for some runtime optimizations.deferred. Default is false, binding values propagate immediately.
*/
    deferred: {
        enumerable: false,
        serializable: true,
        value: null
    },

    serializeSelf: {value: function(serializer) {
        serializer.setReference("boundObject", this.boundObject);
        serializer.set("boundObjectPropertyPath", this.boundObjectPropertyPath);
        serializer.set("oneway", this.oneway);
        serializer.set("deferred", this.deferred);
        serializer.set("converter", this.converter);
    }}
});

Serializer.defineSerializationUnit("bindings", function(object) {
    var bindingDescriptors = object._bindingDescriptors;

    if (bindingDescriptors) {
        return bindingDescriptors;
    }
});

Deserializer.defineDeserializationUnit("bindings", function(object, bindings) {
    var sourcePath;
    for (sourcePath in bindings) {
        Object.defineBinding(object, sourcePath, bindings[sourcePath]);
    }
});

/**
    @function external:Object.defineBinding
    @param {object} sourceObject The source object of the data binding. This object establishes the binding between itself and the "bound object" specified by the <code>bindingDescriptor</code> parameter.
    @param {string} sourceObjectPropertyBindingPath The key path to the source object's property that is being bound.
    @param {object} bindingDescriptor An object that describes the bound object, the bound object's property path, and other properties.
    @see [BindingDescriptor object]{@link module:montage/core/event/binding#BindingDescriptor}
*/
Object.defineProperty(Object, "defineBinding", {value: function(sourceObject, sourceObjectPropertyBindingPath, bindingDescriptor) {
    var _bindingDescriptors = sourceObject._bindingDescriptors,
        oneway = typeof bindingDescriptor.oneway === "undefined" ? false : bindingDescriptor.oneway,
        boundObject = bindingDescriptor.boundObject,
        boundObjectPropertyPath = bindingDescriptor.boundObjectPropertyPath,
        boundObjectValue,
        currentBindingDescriptor,
        comboEventType = "change@" + boundObjectPropertyPath ,
        bindingListener;

    if (!boundObject || !boundObjectPropertyPath) {
        //TODO should we throw an error here? the binding descriptor wasn't valid
        return;
    }

    if (!_bindingDescriptors) {
        // To ensure the binding descriptor collection is serializable, it needs all the expected properties
        //of an object in our framework; a UUID in particular
        sourceObject._bindingDescriptors = _bindingDescriptors = Object.create(Object.prototype);
    }

    // We want binding descriptors to know how to serialize themselves, that functionality is located on
    // BindingDescriptor, most users will have used an object literal as their descriptor though
    if ((bindingDescriptor.__proto__ || Object.getPrototypeOf(bindingDescriptor)) !== BindingDescriptor) {
        if ("__proto__" in bindingDescriptor) {
            bindingDescriptor.__proto__ = BindingDescriptor;
        } else {
            var oldBindingDescriptor = bindingDescriptor;
            bindingDescriptor = Object.create(BindingDescriptor);
            for (var key in oldBindingDescriptor) {
                bindingDescriptor[key] = oldBindingDescriptor[key];
            }
        }
    }

    currentBindingDescriptor = _bindingDescriptors[sourceObjectPropertyBindingPath];

    if (!currentBindingDescriptor) {
        _bindingDescriptors[sourceObjectPropertyBindingPath] = bindingDescriptor;

        //Asking the boundObject to give me a propertyChangeBindingListener. - need to rename that -
        bindingListener = boundObject.propertyChangeBindingListener(comboEventType, null, true/*useCapture*/, null, sourceObject, sourceObjectPropertyBindingPath, bindingDescriptor);

        if (!bindingListener) {
            // The bound object decided it didn't want to install a listener for this binding, for whatever reason
            // We assume that it will eventually establish a binding that delivers on the intent of the one that
            // was just being requested, but it may be tinkering with the binding in some way or perhaps
            // deferring binding installation until later for some reason or another
            return;
        }

        // Use the listener's targetPropertyPath assuming whomever gave us the bindingListener may have changed it from the
        // original boundPropertyPath in the bindingDescriptor. Likewise for the comboEventType
        boundObject = bindingDescriptor.boundObject;
        boundObjectPropertyPath = bindingListener.targetPropertyPath;
        oneway = typeof bindingDescriptor.oneway === "undefined" ? false : bindingDescriptor.oneway;
        comboEventType = "change@" + boundObjectPropertyPath;

        bindingDescriptor.boundObjectPropertyPath = boundObjectPropertyPath;
        bindingDescriptor.bindingListener = bindingListener;

        //I'm setting the listener to be itself
        bindingListener.listener = bindingListener;

        //1) the boundObjectPropertyPath need to be observed on boundObject
        boundObject.addEventListener(comboEventType, bindingListener, true);

        //2) the sourceObjectPropertyBindingPath needs to be observed on sourceObject, only if sourceObjectPropertyBindingPath is expected to change
        //as specified by oneway
        if (!oneway) {
            sourceObject.addEventListener("change@" + sourceObjectPropertyBindingPath, bindingListener, true);
        }

        //3) Convert the value if needed prior to deferring the value or setting it on the source
        boundObjectValue = boundObject.getProperty(boundObjectPropertyPath);

        if (bindingDescriptor.boundValueMutator) {
            boundObjectValue = bindingDescriptor.boundValueMutator(boundObjectValue);
        } else if (bindingDescriptor.converter) {
            boundObjectValue = bindingDescriptor.converter.convert(boundObjectValue);
        }

        //4) Set the value on the source as we establish the binding, unless the binding is deferred or disabled
        if (bindingListener.bindingOriginValueDeferred === true || sourceObject._bindingsDisabled) {
            bindingListener.deferredValue = boundObjectValue;
            bindingListener.deferredValueTarget = "bound";
        } else {
            sourceObject.setProperty(sourceObjectPropertyBindingPath, boundObjectValue);
        }

        return bindingListener;
    } else {
        // If we were trying to install the same binding on the same objects, don't bother with an error
        // TODO this is more of a step to not fail a bunch of tests right now, it's questionable whether this should still be an error or not
        if (boundObject !== currentBindingDescriptor.boundObject || bindingDescriptor.boundObjectPropertyPath !== currentBindingDescriptor.boundObjectPropertyPath) {
            throw("sourceObject property, " + sourceObjectPropertyBindingPath + ", is already the source of a binding");
        }
    }


}});

// Using Montage's defineProperty as it knows how to handle the serializable property
Montage.defineProperty(Object.prototype, "_bindingDescriptors", {enumerable: false, value: null, writable: true});

Object.defineProperty(Object.prototype, "_deserializeProperty_bindingDescriptors", {
    enumerable: false,
    value: function(bindingDescriptors, deserializer) {

        // TODO for now we are inserting the deserialized bindings descriptors into another property
        // so they are not installed until later. The Template will do this after deserializing all objects
        // This is necessary to prevent installing bindings before bound objects are ready
        // Eventually we can probably not bother with this and instead serialize all objects, listeners
        // and binding-decorated setters included such that we don't need to reinstall the bindings
        this._bindingDescriptorsToInstall = bindingDescriptors;
    }
});

/**
    Deletes a single binding on the specified object.
    @function external:Object.deleteBinding
    @param {object} sourceObject The source object that defined the binding.
    @param {string} sourceObjectPropertyBindingPath The key path to the bound object's bound property.
*/
Object.defineProperty(Object, "deleteBinding", {value: function(sourceObject, sourceObjectPropertyBindingPath) {
    var _bindingDescriptors = sourceObject._bindingDescriptors, bindingDescriptor,oneway;
    if (sourceObjectPropertyBindingPath in _bindingDescriptors) {
        bindingDescriptor = _bindingDescriptors[sourceObjectPropertyBindingPath];
        oneway = typeof bindingDescriptor.oneway === "undefined" ? true : bindingDescriptor.oneway;

        //1) the boundObjectPropertyPath need to be removed as a listener on boundObject
        bindingDescriptor.boundObject.removeEventListener("change@" + bindingDescriptor.boundObjectPropertyPath, bindingDescriptor.bindingListener, true);

        //2) the sourceObjectPropertyBindingPath needs to be removed as a listener on sourceObject, only if sourceObjectPropertyBindingPath is expected to change
        //as specified by oneway
        if (!oneway) {
            sourceObject.removeEventListener("change@" + sourceObjectPropertyBindingPath, bindingDescriptor.bindingListener, true);
        }

        delete _bindingDescriptors[sourceObjectPropertyBindingPath];
    }

}});

/**
    Deletes all bindings on the specified object.
    @function external:Object.deleteBindings
    @param {object} object The object to delete bindings from.
*/
Object.defineProperty(Object, "deleteBindings", {value: function(object) {
    var bindingDescriptors = object._bindingDescriptors;

    if (bindingDescriptors) {
        for (var propertyName in bindingDescriptors) {
            if (bindingDescriptors.hasOwnProperty(propertyName)) {
                Object.deleteBinding(object, propertyName);
            }
        }
    }
}});

/**
 * Propagates all deferred values in the object's bindings.
 * Not all deferred values are the consequence of the bindings deferred option, they might come from disabled bindings.
 * @function external:Object.applyBindingsDeferredValues
 * @param {Object} object The object that contains the bindings to be applied.
 * @param {boolean} skipDeferredBindings If set to true deferred bindings values will not be propagated.
 */
Object.defineProperty(Object, "applyBindingsDeferredValues", {value: function(object, skipDeferredBindings) {
    var bindingDescriptors = object._bindingDescriptors,
        bindingListener;

    if (bindingDescriptors) {
        for (var propertyName in bindingDescriptors) {
            if (bindingDescriptors.hasOwnProperty(propertyName)) {
                bindingListener = bindingDescriptors[propertyName].bindingListener;
                if (bindingListener && !(skipDeferredBindings && bindingListener.bindingOriginValueDeferred)) {
                    bindingListener.applyDeferredValues();
                }
            }
        }
    }
}});

Montage.defineProperty(Object.prototype, "_bindingsDisabled", {enumerable: false, value: null});

/**
    Temporarily disables bindings on the specified object. To re-enable bindings, call [Object.enableBindings()]{@link external:Object.enableBindings}.
    @function external:Object.disableBindings
*/
Object.defineProperty(Object, "disableBindings", {value: function(object) {
    object._bindingsDisabled = true;
}});

/**
    Re-enables data binding on the object after being disabled with [Object.disableBindings()]{@link external:Object.disableBindings}, applying any deferred bindings that were queued during the interval.
    @function external:Object#enableBindings
*/
Object.defineProperty(Object, "enableBindings", {value: function(object) {
    object._bindingsDisabled = false;
    Object.applyBindingsDeferredValues(object, true);
}});
