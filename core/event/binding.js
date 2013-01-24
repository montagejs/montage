/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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
    ChangeNotification = require("core/change-notification").ChangeNotification,
    Serializer = require("core/serializer").Serializer,
    Deserializer = require("core/deserializer").Deserializer,
    logger = require("core/logger").logger("binding"),
    defaultEventManager = require("core/event/event-manager").defaultEventManager,
    AT_TARGET = 2,
    UNDERSCORE = "_";

/**
    @class module:montage/core/event/binding.ChangeEventDispatchingArray
*/
var ChangeEventDispatchingArray = exports.ChangeEventDispatchingArray = [];

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
    handleChange:{
        value:function (notification) {

            var bindingOriginTriggeredChange,
                // Left
                bindingOrigin = this.bindingOrigin,
                bindingOriginPropertyPath = this.bindingPropertyPath,
                bindingOriginValue = bindingOrigin.getProperty(bindingOriginPropertyPath),
                // Right
                boundObject = this.target,
                boundObjectPropertyPath = this.targetPropertyPath,
                boundObjectValue;

            // Determine if binding triggered by change on bindingOrigin
            if (boundObject !== bindingOrigin) {
                // the origin and bound object are different objects; easy enough
                bindingOriginTriggeredChange = notification.currentTarget === bindingOrigin;
            } else {
                // otherwise, if the objects are the same the propertyPaths must differ
                bindingOriginTriggeredChange = notification.currentPropertyPath === bindingOriginPropertyPath;
            }

            if (bindingOriginTriggeredChange) {
                // This change notification targeted the left side of the binding; try to push to the right side

                // If this notification was triggered by the right-to-left value push; don't bother setting
                // the value on the left side, that's where all this value changing started
                // (The original right-to-left push installs this changeEvent key on the setProperty function)
                if (bindingOrigin.setProperty.changeEvent) {
                    return;
                }

                // TODO should not assume revert is available
                if (this.bindingDescriptor.converter) {
                    bindingOriginValue = this.bindingDescriptor.converter.revert(bindingOriginValue);
                }

                if (this.bindingOriginValueDeferred === true || bindingOrigin._bindingsDisabled) {
                    this.deferredValue = bindingOriginValue;
                    this.deferredValueTarget = "target";
                } else {
                    this.bindingOriginChangeTriggered = true;
                    // Set the value on the RIGHT side now
                    boundObject.setProperty(boundObjectPropertyPath, bindingOriginValue);
                    this.bindingOriginChangeTriggered = false;
                }

            } else if (!this.bindingOriginChangeTriggered) {

                // Start the right-to-left value push
                boundObjectValue = boundObject.getProperty(boundObjectPropertyPath);

                if (this.bindingDescriptor.boundValueMutator) {
                    boundObjectValue = this.bindingDescriptor.boundValueMutator(boundObjectValue);
                } else if (this.bindingDescriptor.converter) {
                    boundObjectValue = this.bindingDescriptor.converter.convert(boundObjectValue);
                }

                if (boundObjectValue !== bindingOriginValue) {
                    if (this.bindingOriginValueDeferred === true || bindingOrigin._bindingsDisabled) {
                        this.deferredValue = boundObjectValue;
                        this.deferredValueTarget = "bound";
                    } else {
                        // Make the original notification available to the setter
                        bindingOrigin.setProperty.changeEvent = notification;
                        // Set the value on the LEFT side now
                        bindingOrigin.setProperty(bindingOriginPropertyPath, boundObjectValue);
                        bindingOrigin.setProperty.changeEvent = null;
                    }
                }

                // Update the stored value of the propertyPath
                this.previousTargetPropertyPathValue = boundObjectValue;
            }
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

        var targetPropertyPath,
            functionListener = PropertyChangeBindingListener.create();

        functionListener.useCapture = useCapture;
        functionListener.target = this;
        functionListener.originalListener = listener;
        functionListener.originalListenerIsFunction = (typeof listener === "function");


        functionListener.targetPropertyPath = targetPropertyPath = type;
        //This is storing the future prevValue
        functionListener.previousTargetPropertyPathValue = this.getProperty(targetPropertyPath);
        functionListener.targetPropertyPathCurrentIndex = 0;

        if (bindingOrigin) {
            functionListener.bindingOrigin = bindingOrigin;
            functionListener.bindingPropertyPath = bindingPropertyPath;
            functionListener.bindingDescriptor = bindingDescriptor;
            functionListener.bindingOriginValueDeferred = bindingDescriptor.deferred ? true : false;
        }

        return functionListener;
    },
    writable: true
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
        value: null
    },

/**

 The key path of boundObject which sourceObject's sourceObjectBindingPath is bound to

*/
    boundObjectPropertyPath: {
        enumerable: false,
        value: null
    },

/**
 Specifies whether the source Object will push value back to it's boundObject's boundObjectPropertyPath or not. Default is false.
*/
    oneway: {
        enumerable: false,
        value: null
    },

/**
     If true, PropertyChangeBindingListener will buffer the value until it's told to execute binding. Setting this value to false allows for some runtime optimizations.deferred. Default is false, binding values propagate immediately.
*/
    deferred: {
        enumerable: false,
        value: null
    },

    serializeSelf: {value: function(serializer) {
        var serialization = {};

        serializer.addObjectReference(this.boundObject);
        serialization[this.oneway ? "<-" : "<->"] = "@" + serializer.getObjectLabel(this.boundObject) + "." + this.boundObjectPropertyPath;
        serialization.deferred = this.deferred;
        serialization.converter = this.converter;

        return serialization;
    }}
});

Serializer.defineSerializationUnit("bindings", function(object) {
    var bindingDescriptors = object._bindingDescriptors;

    if (bindingDescriptors) {
        var bindings = false;
        var serializableBindings = {};

        for (var prop in bindingDescriptors) {
            var desc = bindingDescriptors[prop];
            // only serialize bindings that don't have a serializable
            // property, or those where the property is truthy
            if (!("serializable" in  desc) || desc.serializable) {
                bindings = true;
                serializableBindings[prop] = desc;
            }
        }

        // Only return if there were some *serializable* bindings
        if (bindings) {
            return serializableBindings;
        }
    }
});

var deserializeBindingToBindingDescriptor = exports.deserializeBindingToBindingDescriptor = function(binding, deserializer) {
    var dotIndex;
    if (!("boundObject" in binding)) {
        var targetPath = binding["<-"] || binding["<->"] || binding["<<->"];

        if ("<<->" in binding) {
            console.warn("WARNING: <<-> in bindings is deprectated, use <-> only, please update now.");
        }

        if (targetPath) {
            if (targetPath[0] !== "@") {
                logger.error("Invalid binding syntax '" + targetPath + "', should be in the form of '@label.path'.");
                throw "Invalid binding syntax '" + targetPath + "'";
            }
        } else {
            logger.error("Invalid binding syntax '" + JSON.stringify(binding) + "'.");
            throw "Invalid binding syntax '" + JSON.stringify(binding) + "'";
        }

        dotIndex = targetPath.indexOf(".");
        binding.boundObject = deserializer.getObjectByLabel(targetPath.slice(1, dotIndex));
        binding.boundObjectPropertyPath = targetPath.slice(dotIndex+1);
        if ("<-" in binding) {
            binding.oneway = true;
        }
    }
};

Deserializer.defineDeserializationUnit("bindings", function(object, bindings, deserializer) {
    for (var sourcePath in bindings) {
        var binding = bindings[sourcePath],
            dotIndex;

        deserializeBindingToBindingDescriptor(binding, deserializer);

        Object.defineBinding(object, sourcePath, binding);
    }
});

var __bindingCount = exports.Stats = {count: 0};

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
        bindingListener;

    if (!boundObject || !boundObjectPropertyPath) {
        //TODO should we throw an error here? the binding descriptor wasn't valid
        return;
    }
    __bindingCount.count++;
    if (!_bindingDescriptors) {
        // To ensure the binding descriptor collection is serializable, it needs all the expected properties
        //of an object in our framework; a UUID in particular
        Montage.defineProperty(sourceObject, "_bindingDescriptors", {
            enumerable: false,
            value: _bindingDescriptors = Object.create(Object.prototype)
        });
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
        bindingListener = boundObject.propertyChangeBindingListener(boundObjectPropertyPath, null, true/*useCapture*/, null, sourceObject, sourceObjectPropertyBindingPath, bindingDescriptor);

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

        bindingDescriptor.boundObjectPropertyPath = boundObjectPropertyPath;
        bindingDescriptor.bindingListener = bindingListener;

        bindingListener.listener = bindingListener;

        //1) the boundObjectPropertyPath needs to be observed on boundObject for all bindings
        boundObject.addPropertyChangeListener(boundObjectPropertyPath, bindingListener, false);

        //2) the sourceObjectPropertyBindingPath needs to be observed on sourceObject if this is a two-way binding
        if (!oneway) {
            sourceObject.addPropertyChangeListener(sourceObjectPropertyBindingPath, bindingListener, false);
        }

        //3) Get the value to set on the source (and convert if necessary)
        boundObjectValue = boundObject.getProperty(boundObjectPropertyPath);

        // Though somewhat deprecated, give the boundValueMutator function precedence over a converter object
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
    var _bindingDescriptors = sourceObject._bindingDescriptors,
        bindingDescriptor,
        oneway;

    if (sourceObjectPropertyBindingPath in _bindingDescriptors) {
        __bindingCount.count--;
        bindingDescriptor = _bindingDescriptors[sourceObjectPropertyBindingPath];
        oneway = typeof bindingDescriptor.oneway === "undefined" ? true : bindingDescriptor.oneway;

        //1) Stop observing the boundObjectPropertyPath on the boundObject
        bindingDescriptor.boundObject.removePropertyChangeListener(bindingDescriptor.boundObjectPropertyPath, bindingDescriptor.bindingListener, false);

        //2) Stop observing the sourceObjectPropertyBindingPath on the sourceObject this was not a oneway binding
        if (!oneway) {
            sourceObject.removePropertyChangeListener(sourceObjectPropertyBindingPath, bindingDescriptor.bindingListener, false);
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
