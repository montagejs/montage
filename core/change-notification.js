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
    @module montage/core/event/change-notification
*/

var Montage = require("montage").Montage,
    logger = require("core/logger").logger("change-notification"),
    UNDERSCORE = "_";

// key: <path>, <target uuid>, <listener uuid>
var _descriptorsDirectory = Object.create(null);

// key: <target uuid>, <path>
var _willChangeDescriptorsDirectory = Object.create(null);
var _willChangeDescriptorsIndexesDirectory = Object.create(null);
var _changeDescriptorsDirectory = Object.create(null);
var _changeDescriptorsIndexesDirectory = Object.create(null);

exports.__reset__ = function() {
    _descriptorsDirectory = Object.create(null);
    _willChangeDescriptorsDirectory = Object.create(null);
    _willChangeDescriptorsIndexesDirectory = Object.create(null);
    _changeDescriptorsDirectory = Object.create(null);
    _changeDescriptorsIndexesDirectory = Object.create(null);
    // also need to remove all installed setters
};

exports.__debug__ = function() {
    console.log("_descriptorsDirectory", _descriptorsDirectory);
    console.log("_willChangeDescriptorsDirectory", _willChangeDescriptorsDirectory, _willChangeDescriptorsIndexesDirectory);
    console.log("_changeDescriptorsDirectory", _changeDescriptorsDirectory, _changeDescriptorsIndexesDirectory);
};

var ChangeNotification = exports.ChangeNotification = Object.create(Montage, {
    // (object) => <object>.uuid
    //
    // (target_n): {
    //     <propertyPath_n>: {
    //         target,
    //         propertyPath,
    //         willChangeListeners: {
    //             (listener_n): {
    //                 listenerTarget,
    //                 listenerFunction,
    //                 listensToMutation
    //             }
    //         },
    //         changeListeners: same as willChangeListeners,
    //         willChangeListenersCount: Object.keys(willChangeListeners).length,
    //         changeListenersCount: Object.keys(changeListeners).length,
    //         handleWillChange: function()
    //         handleChange: function()
    //     }
    // }
    _descriptorsRegistry: {
        writable: true,
        value: Object.create(null)
    },

    _createFunctionDescriptor: {
        value: function(target, listener, beforeChange, mutation) {
            var identifier,
                functionName,
                functionDescriptor = Object.create(ChangeNotificationFunctionDescriptor);

            if (typeof listener === "function") {
                functionDescriptor.listenerFunction = listener;
                functionDescriptor.listenerTarget = target;
            } else {
                identifier = target.identifier;

                if (identifier) {
                    identifier = identifier.toCapitalized();

                    functionName = "handle" + identifier + (beforeChange ? "WillChange" : "Change");
                    if (typeof listener[functionName] === "function") {
                        functionDescriptor.listenerFunctionName = functionName;
                        functionDescriptor.listenerFunction = listener[functionName];
                        functionDescriptor.listenerTarget = listener;
                    }
                }

                if (!functionDescriptor.listenerFunction) {
                    functionName = "handle" + (beforeChange ? "WillChange" : "Change");
                    if (typeof listener[functionName] === "function") {
                        functionDescriptor.listenerFunctionName = functionName;
                        functionDescriptor.listenerFunction = listener[functionName];
                        functionDescriptor.listenerTarget = listener;
                    }
                }
            }

            if (!functionDescriptor.listenerFunction) {
                console.log("Could not find valid listener when installing", target, listener);
                throw "Could not find valid listener when installing";
            }

            functionDescriptor.listensToMutation = mutation;
            return functionDescriptor;
        }
    },

    registerPropertyChangeListener: {
        value: function(target, path, listener, beforeChange, mutation) {
            var targetKey = target.uuid,
                registry = this._descriptorsRegistry,
                targetEntry = registry[targetKey],
                descriptor;

            if (path == null) {
                path = "*";
                mutation = true;
            }

            if (!targetEntry) {
                targetEntry = registry[targetKey] = Object.create(null);
                targetEntry.propertyPathCount = 0;
            }

            descriptor = targetEntry[path];
            if (!descriptor) {
                descriptor = targetEntry[path] = Object.create(ChangeNotificationDescriptor).initWithTargetPath(target, path);
                targetEntry.propertyPathCount++;
            }
            descriptor.registerListener(listener, beforeChange, mutation);

            return descriptor;
        }
    },

    unregisterPropertyChangeListener: {
        value: function(target, path, listener, beforeChange) {
            var targetKey = target.uuid,
                registry = this._descriptorsRegistry,
                targetEntry = registry[targetKey],
                descriptor;

            if (path == null) {
                path = "*";
            }

            if (targetEntry) {
                descriptor = targetEntry[path];
                if (descriptor) {
                    // TODO: should this function return the number of listeners?
                    descriptor.unregisterListener(listener, beforeChange);
                    if (descriptor.willChangeListenersCount === 0 &&
                        descriptor.changeListenersCount === 0) {
                        delete targetEntry[path];
                        if (--targetEntry.propertyPathCount === 0) {
                            delete registry[targetKey];
                        }
                    }
                }
            }
        }
    },

    getPropertyChangeDescriptor: {
        value: function(target, path) {
            var targetEntry = this._descriptorsRegistry[target.uuid];

            if (targetEntry) {
                if (path == null) {
                    path = "*";
                }
                return targetEntry[path];
            }
        }
    },

    __debug__: {
        value: function() {
            console.log("_descriptorsRegistry: ", this._descriptorsRegistry);
        }
    },

    __reset__: {
        value: function() {
            this._descriptorsRegistry = Object.create(null);
        }
    }
});

var ChangeNotificationDescriptor = Montage.create(Montage, {
    target: {value: null},
    propertyPath: {value: null},
    willChangeListeners: {value: null},
    changeListeners: {value: null},
    willChangeListenersCount: {value: 0},
    changeListenersCount: {value: 0},
    isActive: {value: false},
    // list of all objects that this listener needed to start listening to.
    // these are the objects in the target.getProperty(path).
    // format [(target, propertyName, remainingPath)*]
    dependencies: {value: null},
    hasWillChangeDependencies: {value: false},
    hasChangeDependencies: {value: false},
    // index of where this listener is expected to be in its dependent listeners
    dependentDescriptorsIndex: {value: null},
    mutationDependencyIndex: {value: null},
    mutationListenersCount: {value: 0},
    observedDependentProperties: {value: null},

    initWithTargetPath: {
        value: function(target, path) {
            this.target = target;
            this.propertyPath = path;

            return this;
        }
    },
    registerListener: {
        value: function(listener, beforeChange, mutation) {
            var listenerKey = listener.uuid,
                listeners;

            if (beforeChange) {
                listeners = this.willChangeListeners;
                if (!listeners) {
                    listeners = this.willChangeListeners = Object.create(null);
                }
                if (!(listenerKey in listeners)) {
                    listeners[listenerKey] = ChangeNotification._createFunctionDescriptor(this.target, listener, beforeChange, mutation);
                    this.willChangeListenersCount++;
                    if (mutation) {
                        this.mutationListenersCount++;
                    }
                }
            } else {
                listeners = this.changeListeners;
                if (!listeners) {
                    listeners = this.changeListeners = Object.create(null);
                }
                if (!(listenerKey in listeners)) {
                    listeners[listenerKey] = ChangeNotification._createFunctionDescriptor(this.target, listener, beforeChange, mutation);
                    this.changeListenersCount++;
                    if (mutation) {
                        this.mutationListenersCount++;
                    }
                }
            }
        }
    },
    unregisterListener: {
        value: function(listener, beforeChange) {
            var listenerKey = listener.uuid,
                listeners;

            if (beforeChange) {
                listeners = this.willChangeListeners;
                if (listeners && listenerKey in listeners) {
                    if (listeners[listenerKey].listensToMutation) {
                        this.mutationListenersCount--;
                    }
                    delete listeners[listenerKey];
                    this.willChangeListenersCount--;
                }
            } else {
                listeners = this.changeListeners;
                if (listeners && listenerKey in listeners) {
                    if (listeners[listenerKey].listensToMutation) {
                        this.mutationListenersCount--;
                    }
                    delete listeners[listenerKey];
                    this.changeListenersCount--;
                }
            }

            if (this.willChangeListenersCount === 0 &&
                this.changeListenersCount === 0) {
                // no need to listen to any dependencies now.
                this.removeDependencies();
            }
        }
    },
    hasListeners: {
        value: function() {
            return this.willChangeListenersCount > 0 ||
                   this.changeListenersCount > 0;
        }
    },

    setupDependencies: {
        value: function(target, path, beforeChange, mutation) {
            var dependencies = this.dependencies;

            if (this.hasChangeDependencies) {
                // if we're at this point it means that the only dependencies to install is
                // beforeChange dependencies, give up if they're already installed.
                if (this.hasWillChangeDependencies || !beforeChange) {
                    return;
                }
                // since the dependencies array is already setup, might as well use
                // it instead of going through getProperty again.
                for (var i = 0, l = dependencies.length; i < l; i+=3) {
                    dependencies[i].addPropertyChangeListener(dependencies[i+1], this, true, dependencies[i+2] != null);
                }
            } else {
                this.addDependency(target, path, beforeChange, mutation);
            }

            if (!this.hasChangeDependencies) {
                // At this point change dependencies were definitely installed
                // because we always need them to get the "plus" value.
                if (beforeChange) {
                    this.hasWillChangeDependencies = true;
                }
                this.hasChangeDependencies = true;
            } else {
                // If change dependencies were already installed then the only
                // option left is that will change dependencies were now installed.
                this.hasWillChangeDependencies = true;
            }
        }
    },

    addDependency: {
        value: function (target, path, beforeChange, mutation) {
            var self = this,
                ignoreMutation;

            target.getProperty(path, null, null, function (target, propertyName, result, index, remainingPath) {

                ignoreMutation = mutation ? remainingPath != null : true;
                if (beforeChange) {
                    target.addPropertyChangeListener(propertyName, self, true, ignoreMutation);
                }
                // we always need to listen to the "afterChange" notification because
                // we only have access to the plus object at that time.
                // we need that object in order to install the new listeners
                // on the remainingPath.

                target.addPropertyChangeListener(propertyName, self, false, ignoreMutation);
                self.registerDependency(target, propertyName, remainingPath);
            });
        }
    },

    removeDependencies: {
        value: function() {
            var dependencies = this.dependencies,
                target,
                propertyName,
                descriptor;

            if (dependencies) {
                for (var i = 0, l = dependencies.length; i < l; i+=3) {
                    target = dependencies[i];
                    propertyName = dependencies[i+1];
                    descriptor = ChangeNotification.getPropertyChangeDescriptor(target, propertyName);

                    if (this.hasWillChangeDependencies) {
                        target.removePropertyChangeListener(propertyName, this, true);
                    }
                    if (this.hasChangeDependencies) {
                        target.removePropertyChangeListener(propertyName, this);
                    }
                    if (descriptor) {
                        delete descriptor.dependentDescriptorsIndex[this.uuid];
                    }
                }
                dependencies.length = 0;
            }
        }
    },
    updateDependenciesAtIndex: {
        value: function(index, oldValue, newValue) {
            var self = this,
                dependencies = this.dependencies,
                remainingPath = dependencies[index+2];

            // remove listeners from the old value
            if (oldValue != null) {
                oldValue.getProperty(remainingPath, null, null, function(target, propertyName, result, index, remainingPath) {

                    self.unregisterDependency(target, propertyName, remainingPath);

                    if (self.hasWillChangeDependencies) {
                        target.removePropertyChangeListener(propertyName, self, true);
                    }
                    if (self.hasChangeDependencies) {
                        target.removePropertyChangeListener(propertyName, self);
                    }
                });
            }

            // add listeners to the new value
            if (newValue != null) {
                newValue.getProperty(remainingPath, null, null, function(target, propertyName, result, index, remainingPath) {
                    if (self.hasWillChangeDependencies) {
                        target.addPropertyChangeListener(propertyName, self, true, remainingPath != null);
                    }
                    if (self.hasChangeDependencies) {
                        target.addPropertyChangeListener(propertyName, self, false, remainingPath != null);
                    }
                    self.registerDependency(target, propertyName, remainingPath);
                });
            }
        }
    },
    updateDependencies: {
        value: function(notification) {
            var dependenciesIndex = notification._dependenciesIndex;

            if (dependenciesIndex != null) {
                // This property change was triggered by a change in one of the
                // dependencies, therefore we need to remove all the listeners
                // from the old values and add listeners to the new ones.
                if (notification.isMutation) {
                    // If this listener is being triggered by a mutation change then
                    // we need to go through the old values and remove the listeners
                    // and go through the new values and add listeners.
                    for (var i = 0, l = notification.minus.length; i < l; i++) {
                        this.updateDependenciesAtIndex(dependenciesIndex, notification.minus[i], null);
                    }
                    for (var i = 0, l = notification.plus.length; i < l; i++) {
                        this.updateDependenciesAtIndex(dependenciesIndex, null, notification.plus[i]);
                    }
                } else {
                    this.updateDependenciesAtIndex(dependenciesIndex, notification.minus, notification.plus);
                }
            } else if (this.mutationListenersCount > 0 && !notification.isMutation) {
                // We're listening to mutation events on the property so we need
                // to remove the mutation listener on the old value and add it
                // to the new one.
                // However, we should restrict ourselves to notifications that
                // actually change the value at a property path, mutation doesn't
                // change the value at the property path, the value itself is
                // still the same.
                this.updateMutationDependency(notification.plus);
            }
        }
    },
    updateMutationDependency: {
        value: function(newTarget) {
            var target,
                installMutationDependency;

            if (this.mutationDependencyIndex != null) {
                var target = this.dependencies[this.mutationDependencyIndex];
            }

            if (target === newTarget) {
                return;
            }

            installMutationDependency = this.mutationListenersCount > 0 &&
                                        newTarget != null &&
                                        typeof newTarget === "object";

            if (target) {
                this.unregisterDependency(target, null, null);
                target.removePropertyChangeListener(null, this, true);
                target.removePropertyChangeListener(null, this, false);
                this.mutationDependencyIndex = null;
            }
            if (installMutationDependency) {
                if (this.willChangeListenersCount > 0) {
                    newTarget.addPropertyChangeListener(null, this, true);
                }
                if (this.changeListenersCount > 0) {
                    newTarget.addPropertyChangeListener(null, this, false);
                }
                this.mutationDependencyIndex = this.registerDependency(newTarget, null, null);
            }
        }
    },
    registerDependency: {
        value: function(target, propertyName, remainingPath) {
            var dependencyDescriptor = ChangeNotification.getPropertyChangeDescriptor(target, propertyName),
                dependentDescriptorsIndex,
                dependencies,
                dependentKey,
                ix;

            if (dependencyDescriptor) {
                dependentDescriptorsIndex = dependencyDescriptor.dependentDescriptorsIndex;
                dependencies = this.dependencies;
                dependentKey = this.uuid;

                if (!dependencies) {
                    dependencies = this.dependencies = [];
                }
                // TODO: should use descriptor after all?
                ix = dependencies.push(target, propertyName, remainingPath) - 3;
                if (!dependentDescriptorsIndex) {
                    dependentDescriptorsIndex = dependencyDescriptor.dependentDescriptorsIndex = Object.create(null);
                }
                if (!(dependentKey in dependentDescriptorsIndex)) {
                    dependentDescriptorsIndex[dependentKey] = ix;
                }

                return ix;
            }
        }
    },
    unregisterDependency: {
        value: function(target, propertyName, remainingPath) {
            var dependencyDescriptor = ChangeNotification.getPropertyChangeDescriptor(target, propertyName),
                dependencies = this.dependencies,
                targetIx;

            if (dependencyDescriptor) {
                do {
                    targetIx = dependencies.indexOf(target);
                    if (dependencies[targetIx+1] === propertyName &&
                        dependencies[targetIx+2] === remainingPath) {
                        dependencies.splice(targetIx, 3);
                        break;
                    } else {
                        targetIx = dependencies.indexOf(target, targetIx+1);
                    }
                } while (targetIx != -1);
                if (targetIx == -1) {
                    throw "getProperty target (" + this.target.uuid + ":" + propertyName + ") not found in dependencies for " + this.propertyPath;
                }

                delete dependencyDescriptor.dependentDescriptorsIndex[this.uuid];
            }
        }
    },
    handleWillChange: {
        value: function(notification) {
            notification.phase = "before";
            this.handleChange(notification, this.willChangeListeners);
        }
    },
    handleChange: {
        value: function(notification, listeners) {
            var listener,
                dependentDescriptorsIndex = this.dependentDescriptorsIndex,
                dependenciesIndex = notification._dependenciesIndex,
                isMutationNotification,
                uuid = this.uuid;

            // we need to stop circular property dependencies.
            // e.g.: object.foo depends on object.bar and object.bar depends on object.foo.
            if (notification[uuid]) {
                return;
            }

            // TODO: maybe I should replicate this
            if (arguments.length < 2) {
                listeners = this.changeListeners;
                notification.phase = "after";
                this.updateDependencies(notification);
            }

            // TODO: I need to know the index of dependency, should this be in the notification?
            if (listeners) {
                notification._dependenciesIndex = null;
                notification.currentTarget = this.target;
                notification.currentPropertyPath = this.propertyPath;
                isMutationNotification = notification.isMutation;
                for (var key in listeners) {
                    listener = listeners[key];

                    // NOTE it's possible to have a changeListener not listen for mutations in cases
                    // where it will still need to react to them. This is the case when the propertyPath depends
                    // upon other propertyPaths. The installed changeListener will not necessarily listen for mutations
                    // but the other changeListeners installed to observe the dependent properties were listening to
                    // mutation, as is the original function. So call the listenerFunction.
                    if ((isMutationNotification && this.target._dependenciesForProperty &&
                            this.target._dependenciesForProperty[this.propertyPath])
                            || !isMutationNotification || listener.listensToMutation) {

                        if (dependentDescriptorsIndex) {
                            notification._dependenciesIndex = dependentDescriptorsIndex[key];
                        }
                        notification[uuid] = true;
                        listener.listenerFunction.call(listener.listenerTarget, notification);
                        notification[uuid] = false;
                    }
                }
                notification._dependenciesIndex = dependenciesIndex;
            }
        }
    }
});

var ChangeNotificationFunctionDescriptor = Object.create(null, {
    listenerTarget: {writable: true, value: null},
    listenerFunction: {writable: true, value: null},
    listenerFunctionName: {writable: true, value: null},
    listensToMutation: {writable: true, value: false}
});

var ObjectPropertyChangeDispatcherManager = Object.create(null, {
    installDispatcherOnTargetProperty: {
        value: function(target, propertyName) {
            var prototypeAndDescriptor,
                currentPropertyDescriptor,
                currentSetter,
                prototypeDefiningProperty;

            prototypeAndDescriptor = Object.getPrototypeAndDescriptorDefiningProperty(target, propertyName);
            currentPropertyDescriptor = prototypeAndDescriptor.propertyDescriptor;

            if (currentPropertyDescriptor) {
                currentSetter = currentPropertyDescriptor.set;
                prototypeDefiningProperty = prototypeAndDescriptor.prototype;

                if ("value" in currentPropertyDescriptor) {
                    this.addDispatcherToTargetProperty(target, propertyName, currentPropertyDescriptor.enumerable);
                } else if (currentSetter && !currentSetter.isDispatchingSetter) {
                    this.addDispatcherToTargetPropertyWithDescriptor(target, propertyName, currentPropertyDescriptor);
                }
            } else {
                this.addDispatcherToTargetProperty(target, propertyName, true);
            }
        }
    },

    uninstallDispatcherOnTargetProperty: {
        value: function(target, propertyName) {

        }
    },

    dispatcherPropertyNamePrefix: {
        value: "_"
    },

    addDispatcherToTargetProperty: {
        value: function(target, propertyName, enumerable) {
            var prefixedPropertyName = this.dispatcherPropertyNamePrefix + propertyName;

            DispatcherPropertyDescriptor.enumerable = enumerable;
            PrefixedPropertyDescriptor.value = target[propertyName];
            DispatcherPropertyDescriptor.get = function() {
                return this[prefixedPropertyName];
            };
            DispatcherPropertyDescriptor.set = function changeNotificationSetter(value) {
                var descriptor = ChangeNotification.getPropertyChangeDescriptor(target, propertyName),
                    previousValue,
                    notification;

                if (!descriptor) {
                    this[prefixedPropertyName] = value;
                    return;
                }

                previousValue = this[prefixedPropertyName];
                if (previousValue === value) {
                    // Nothing to do here
                    return;
                }

                if (descriptor.isActive &&
                    target === descriptor.target &&
                    propertyName === descriptor.propertyPath) {
                    //console.log("Cycle detected at ", target, " ", propertyName);
                    return;
                }

                // TODO: recycle these notification objects
                notification = Object.create(PropertyChangeNotification);
                notification.target = this;
                notification.propertyPath = propertyName;
                notification.minus = previousValue;

                descriptor.isActive = true;
                descriptor.handleWillChange(notification);
                this[prefixedPropertyName] = value;
                notification.plus = this[prefixedPropertyName];
                descriptor.handleChange(notification);
                descriptor.isActive = false;
            };
            DispatcherPropertyDescriptor.set.isDispatchingSetter = true;

            delete target[propertyName];
            Object.defineProperty(target, prefixedPropertyName, PrefixedPropertyDescriptor);
            Object.defineProperty(target, propertyName, DispatcherPropertyDescriptor);
        }
    },

    addDispatcherToTargetPropertyWithDescriptor: {
        value: function(target, propertyName, propertyDescriptor) {
            var originalSetter = propertyDescriptor.set;

            DispatcherPropertyDescriptor.enumerable = propertyDescriptor.enumerable;
            PrefixedPropertyDescriptor.value = target[propertyName];
            DispatcherPropertyDescriptor.get = propertyDescriptor.get;
            DispatcherPropertyDescriptor.set = function changeNotificationSetter(value) {
                var descriptor = ChangeNotification.getPropertyChangeDescriptor(target, propertyName),
                    previousValue,
                    notification;

                if (!descriptor) {
                    originalSetter.apply(this, arguments);
                    return;
                }

                previousValue = this[propertyName];
                if (previousValue === value) {
                    originalSetter.apply(this, arguments);
                    // Nothing more to do here
                    return;
                }

                if (descriptor.isActive &&
                    target === descriptor.target &&
                    propertyName === descriptor.propertyPath &&
                    changeNotificationSetter.caller !== originalSetter) {
                    //console.log("Cycle detected at ", target, " ", propertyName);
                    return;
                }

                // TODO: recycle these notification objects
                notification = Object.create(PropertyChangeNotification);
                notification.target = this;
                notification.propertyPath = propertyName;
                notification.minus = previousValue;
                notification.plus = value;

                descriptor.isActive = true;
                descriptor.handleWillChange(notification);
                originalSetter.apply(this, arguments);
                notification.plus = this[propertyName];
                // this is a setter so we have no idea what it does to the value given
                // that's why we need to retrieve the value again
                descriptor.handleChange(notification);
                descriptor.isActive = false;
            };
            DispatcherPropertyDescriptor.set.isDispatchingSetter = true;
            DispatcherPropertyDescriptor.set.originalSetter = originalSetter;
            Object.defineProperty(target, propertyName, DispatcherPropertyDescriptor);
        }
    },

    removeDispatcherOnTargetProperty: {
        value: function(target, propertyName) {

        }
    }
});

Object.defineProperty(Object.prototype, "dispatchPropertyChange", {
    value: function(/*affected paths,..., callback*/) {

        var argumentCount = arguments.length,
            callbackArgumentIndex = argumentCount - 1,
            callback,
            i,
            iProperty,
            descriptor,
            observedProperties,
            observedPropertyCount,
            notification;

        if (argumentCount < 2) {
            throw "Affected property (or properties) and callback to effect change are required to dispatchPropertyChange";
        }

        callback = arguments[callbackArgumentIndex];

        if (!(callback && typeof callback == "function")) {
            throw "Callback to effect actual change is required to dispatchPropertyChange";
        }

        // Storing observedProperties as [propertyA, descriptorA, notificationA, propertyB, descriptorB, notificationB...]
        observedProperties = [];

        for (i = 0; i < callbackArgumentIndex; i++) {
            iProperty = arguments[i];
            descriptor = ChangeNotification.getPropertyChangeDescriptor(this, iProperty);
            if (descriptor && !descriptor.isActive) {
                notification = Object.create(PropertyChangeNotification);
                observedProperties.push(iProperty, descriptor, notification);

                notification.target = this;
                notification.minus = this.getProperty(iProperty);
                descriptor.isActive = true;
                descriptor.handleWillChange(notification);
            }
        }

        callback.call(this);

        for (i = 0, observedPropertyCount = observedProperties.length; i < observedPropertyCount; i+=3) {
            iProperty = observedProperties[i];
            descriptor = observedProperties[i+1];
            notification = observedProperties[i+2];

            notification.plus = this.getProperty(iProperty);
            descriptor.handleChange(notification);
            descriptor.isActive = false;
        }

    }
});

Object.defineProperty(Object.prototype, "addPropertyChangeListener", {
    value: function(path, listener, beforeChange, ignoreMutation) {
        var descriptor,
            dependentPropertyPaths,
            i,
            iPath;

        // If the uuid isn't consistent, the target isn't observable without leaking memory
        // as we'll never be able to unregister it
        if (!listener || !path || this.uuid !== this.uuid) {
            return;
        }

        descriptor = ChangeNotification.registerPropertyChangeListener(this, path, listener, beforeChange, !ignoreMutation);
        // if it's a multiple property path then setup the dependencies, otherwise
        // install a dispatcher on the property unless the target explicitly
        // asks not to with automaticallyDispatchPropertyChangeListener.
        if (path.indexOf(".") !== -1) {
            descriptor.setupDependencies(this, path, beforeChange, !ignoreMutation);
        } else {
            if (typeof this.automaticallyDispatchPropertyChangeListener !== "function" ||
                    this.automaticallyDispatchPropertyChangeListener(path)) {
                ObjectPropertyChangeDispatcherManager.installDispatcherOnTargetProperty(this, path);
                // give an opportunity for the actual value of the path to have something
                // to say when it comes to property change listeners, this is useful,
                // for instance, for arrays, that can start listen on mutation.
                if (!ignoreMutation && descriptor.mutationListenersCount == 1) {
                    descriptor.updateMutationDependency(this[path]);
                }
            }

            // Observe any paths this property is dependent upon, as found in the dependencies attribute of
            // this property's descriptor
            dependentPropertyPaths = this._dependenciesForProperty ? this._dependenciesForProperty[path] : null;

            // TODO should adding a dispatcher on a dependent property also be subjected to checking for
            // automaticDispatchPropertyChangeListener, probably
            if (dependentPropertyPaths) {

                if (!descriptor.observedDependentProperties) {
                    descriptor.observedDependentProperties = {};
                }

                for (i = 0; (iPath = dependentPropertyPaths[i]); i++) {

                    if (!descriptor.observedDependentProperties[iPath]) {
                        descriptor.observedDependentProperties[iPath] = true;

                        this.addPropertyChangeListener(iPath, descriptor, beforeChange, false);
                        descriptor.registerDependency(this, iPath, null);
                    }
                }
            }
        }
    }
});
Object.defineProperty(Object.prototype, "removePropertyChangeListener", {
    value: function removePropertyChangeListener(path, listener, beforeChange) {
        var descriptor = ChangeNotification.getPropertyChangeDescriptor(this, path);

        if (!descriptor) {
            return;
        }

        ChangeNotification.unregisterPropertyChangeListener(this, path, listener, beforeChange);
        descriptor.updateMutationDependency();
    }
});

var _unobservable_string_property_regexp = /^length$/;
Object.defineProperty(String.prototype, "addPropertyChangeListener", {
    value: function(path, listener, beforeChange, ignoreMutation) {

        if (path != null && _unobservable_string_property_regexp.test(path)) {
            return;
        }

        Object.prototype.addPropertyChangeListener.call(this, path, listener, beforeChange, ignoreMutation);
    }
});

var DispatcherPropertyDescriptor = {
    configurable: true
};

var PrefixedPropertyDescriptor = {
    enumerable: false,
    writable: true,
    configurable: true
};

var PropertyChangeNotification = exports.PropertyChangeNotification = {
    phase: null,
    target: null,
    propertyPath: null,
    minus: null,
    plus: null,
    currentTarget: null,
    currentPropertyPath: null,
    isMutation: false
};

var ChangeNotificationDispatchingArray = exports.ChangeNotificationDispatchingArray = [];
var _index_array_regexp = /^[0-9]+$/;
var _unobservable_array_property_regexp = /^length$/;
Object.defineProperty(Array.prototype, "addPropertyChangeListener", {
    value: function(path, listener, beforeChange, ignoreMutation) {
        var listenChange, listenIndexChange, listenFunctionChange,
            descriptor,
            dotIndex;

        if (!listener) {
            return;
        }

        if (path == null || (dotIndex = path.indexOf(".")) == -1) {


            if (_unobservable_array_property_regexp.test(path)) {
                return;
            }

            listenFunctionChange = path ? /\(.*\)/.test(path) : false; //TODO extract this regex
            listenChange = (path == null);
            listenIndexChange = _index_array_regexp.test(path);
        }

        if (listenChange || listenIndexChange || listenFunctionChange) {
            if (!this.isDispatchingArray) {
                this.__proto__ = ChangeNotificationDispatchingArray;
            }
            descriptor = ChangeNotification.registerPropertyChangeListener(this, (listenFunctionChange ? null : path), listener, beforeChange, !ignoreMutation);

            // give an opportunity for the actual value of the path to have something
            // to say when it comes to property change listeners, this is useful,
            // for instance, for arrays, that can start listen on mutation.
            if (listenIndexChange && !ignoreMutation && descriptor.mutationListenersCount == 1) {
                descriptor.updateMutationDependency(this[path]);
            }
        } else {
            Object.prototype.addPropertyChangeListener.apply(this, arguments);
            // We need to do this because the Object.prototype.addPropertyChangeListener doesn't create dependencies
            // for no-dot paths, but in array array.path will have dependencies when path is not an index or null.
            if (dotIndex == -1) {
                descriptor = ChangeNotification.getPropertyChangeDescriptor(this, path);
                descriptor.setupDependencies(this, path, beforeChange, !ignoreMutation);
            }
        }
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_dispatchArrayChangeNotification", {
    enumerable: false,
    configurable: false,
    value: function(methodName, methodArguments, index, howManyToRemove, newValues) {
        var descriptor = ChangeNotification.getPropertyChangeDescriptor(this, null),
            result,
            notification,
            indexNotification = Object.create(PropertyChangeNotification),
            delta,
            currentLength = this.length,
            howManyToAdd = newValues.length,
            maxLength,
            oldValues = this.slice(index, index+howManyToRemove);

        indexNotification.target = this;

        // can't remove more than the available elements.
        if (index + howManyToRemove > currentLength) {
            howManyToRemove = currentLength - index;
        }
        delta = howManyToAdd - howManyToRemove;
        maxLength = currentLength + (delta > 0 ? delta : 0);

        if (descriptor) {
            notification = Object.create(PropertyChangeNotification);
            notification.target = this;
            notification.minus = oldValues;
            notification.plus = newValues;
            notification.index = index;
            notification.isMutation = true;
            // dispatch mutation notification
            descriptor.handleWillChange(notification);
        }
        this._dispatchArrayBulkWillChangeNotification(indexNotification, index, newValues, delta, maxLength);

        result = this[methodName].apply(this, methodArguments);

        if (descriptor) {
            notification.plus = newValues;
            // dispatch mutation notification
            descriptor.handleChange(notification);
        }
        this._dispatchArrayBulkChangeNotification(indexNotification, index, oldValues, delta, maxLength);

        return result;
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_dispatchArrayBulkWillChangeNotification", {
    enumerable: false,
    configurable: false,
    value: function(notification, index, plus, delta, maxLength) {
        var descriptor,
            oldValue,
            newValue;

        for (var i = 0, l = plus.length; i < l; i++, index++) {
            descriptor = ChangeNotification.getPropertyChangeDescriptor(this, index);
            if (descriptor) {
                oldValue = this[index];
                newValue = plus[i];
                if (oldValue !== newValue) {
                    notification.index = index;
                    notification.propertyPath = String(index);
                    notification.minus = oldValue;
                    descriptor.handleWillChange(notification);
                }
            }
        }

        if (delta != 0) {
            for (; index < maxLength; index++) {
                descriptor = ChangeNotification.getPropertyChangeDescriptor(this, index);
                if (descriptor) {
                    oldValue = this[index];
                    newValue = this[index-delta];
                    if (oldValue !== newValue) {
                        notification.index = index;
                        notification.propertyPath = String(index);
                        notification.minus = oldValue;
                        descriptor.handleWillChange(notification);
                    }
                }
            }
        }
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_dispatchArrayBulkChangeNotification", {
    enumerable: false,
    configurable: false,
    value: function(notification, index, minus, delta, maxLength) {
        var descriptor,
            oldValue,
            newValue;

        for (var i = 0, l = minus.length; i < l; i++, index++) {
            descriptor = ChangeNotification.getPropertyChangeDescriptor(this, index);
            if (descriptor) {
                oldValue = minus[i];
                newValue = this[index];
                if (oldValue !== newValue) {
                    notification.index = index;
                    notification.propertyPath = String(index);
                    notification.minus = oldValue;
                    notification.plus = newValue;
                    descriptor.handleChange(notification);
                }
            }
        }

        if (delta != 0) {
            for (; index < maxLength; index++) {
                descriptor = ChangeNotification.getPropertyChangeDescriptor(this, index);
                if (descriptor) {
                    oldValue = this[index+delta];
                    newValue = this[index];
                    if (oldValue !== newValue) {
                        notification.index = index;
                        notification.propertyPath = String(index);
                        notification.minus = oldValue;
                        notification.plus = newValue;
                        descriptor.handleChange(notification);
                    }
                }
            }
        }
    }
});

Object.defineProperty(Array.prototype, "_setProperty", {
    enumerable: false,
    configurable: true,
    value: function(index, value) {
        return this[index] = value;
    }
});
Object.defineProperty(Array.prototype, "setProperty", {
    enumerable: false,
    configurable: true,
    value: function(path, value) {
        if (String(path).indexOf(".") == -1) {
            if (this.__proto__ === ChangeNotificationDispatchingArray && !isNaN(path)) {
                return this._dispatchArrayChangeNotification("_setProperty", arguments, Number(path), 1, Array.prototype.slice.call(arguments, 1, 2));
            } else {
                return this[path] = value;
            }
        } else {
            return Object.prototype.setProperty.apply(this, arguments);
        }
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "isDispatchingArray", {
    enumerable: false,
    configurable: false,
    value: true
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_splice", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.splice
});
Object.defineProperty(ChangeNotificationDispatchingArray, "splice", {
    enumerable: false,
    configurable: true,
    value: function(index, howMany/*[, element1[, ...[, elementN]]]*/) {
        return this._dispatchArrayChangeNotification("_splice", arguments, index, howMany, Array.prototype.slice.call(arguments, 2));
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_shift", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.shift
});
Object.defineProperty(ChangeNotificationDispatchingArray, "shift", {
    enumerable: false,
    configurable: true,
    value: function() {
        return this._dispatchArrayChangeNotification("_shift", arguments, 0, 1, []);
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_unshift", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.unshift
});
Object.defineProperty(ChangeNotificationDispatchingArray, "unshift", {
    enumerable: false,
    configurable: true,
    value: function() {
        return this._dispatchArrayChangeNotification("_unshift", arguments, 0, 0, Array.prototype.slice.call(arguments, 0));
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_push", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.push
});
Object.defineProperty(ChangeNotificationDispatchingArray, "push", {
    enumerable: false,
    configurable: true,
    value: function() {
        return this._dispatchArrayChangeNotification("_push", arguments, this.length, 0, Array.prototype.slice.call(arguments, 0));
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_pop", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.pop
});
Object.defineProperty(ChangeNotificationDispatchingArray, "pop", {
    enumerable: false,
    configurable: true,
    value: function() {
        if (this.length > 0) {
            return this._dispatchArrayChangeNotification("_pop", arguments, this.length-1, 1, []);
        }
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_reverse", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.reverse
});
Object.defineProperty(ChangeNotificationDispatchingArray, "reverse", {
    enumerable: false,
    configurable: true,
    value: function() {
        var length = this.length;
        if (length === 0) {
            return;
        }

        var descriptor = ChangeNotification.getPropertyChangeDescriptor(this, null),
            indexDescriptor,
            notification,
            indexNotification = Object.create(PropertyChangeNotification),
            oldValue,
            newValue;

        indexNotification.target = this;

        if (descriptor) {
            notification = Object.create(PropertyChangeNotification);
            notification.target = this;
            notification.isMutation = true;
            descriptor.handleWillChange(notification);
        }

        for (var i = 0; i < length; i++) {
            indexDescriptor = ChangeNotification.getPropertyChangeDescriptor(this, i);
            if (indexDescriptor) {
                oldValue = this[i];
                if (oldValue !== this[length-i-1]) {
                    indexNotification.index = i;
                    indexNotification.propertyPath = String(i);
                    indexNotification.minus = oldValue;
                    indexDescriptor.handleWillChange(indexNotification);
                }
            }
        }

        this._reverse();

        if (descriptor) {
            // nothing was really added or removed...
            notification.minus = notification.plus = [];
            descriptor.handleChange(notification);
        }

        for (var i = 0; i < length; i++) {
            indexDescriptor = ChangeNotification.getPropertyChangeDescriptor(this, i);
            if (indexDescriptor) {
                oldValue = this[length-i-1];
                newValue = this[i];
                if (oldValue !== newValue) {
                    indexNotification.index = i;
                    indexNotification.propertyPath = String(i);
                    indexNotification.minus = oldValue;
                    indexNotification.plus = newValue;
                    indexDescriptor.handleChange(indexNotification);
                }
            }
        }
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_sortIndexArray", {
    enumerable: false,
    configurable: true,
    value: []
});
Object.defineProperty(ChangeNotificationDispatchingArray, "_sortDefaultCompareFunction", {
    enumerable: false,
    configurable: true,
    value: function(a, b) {
        return String(a).localeCompare(String(b));
    }
});
Object.defineProperty(ChangeNotificationDispatchingArray, "_sort", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.sort
});
Object.defineProperty(ChangeNotificationDispatchingArray, "sort", {
    enumerable: false,
    configurable: true,
    value: function(compareFunction) {
        var self,
            length = this.length,
            descriptor,
            indexDescriptor,
            notification,
            indexNotification,
            oldValue,
            newValue,
            indexArray,
            _sortIndexArray,
            _sortIndexArrayLength;

        if (length === 0) {
            return;
        }

        if (!compareFunction) {
            compareFunction = this._sortDefaultCompareFunction;
        }

        self = this;
        _sortIndexArray = ChangeNotificationDispatchingArray._sortIndexArray;
        _sortIndexArrayLength = _sortIndexArray.length;

        if (_sortIndexArrayLength < length) {
            _sortIndexArray[length] = length-1;
            for (var i = _sortIndexArrayLength; i < length; i++) {
                _sortIndexArray[i] = i;
            }
        }
        // http://jsperf.com/array-of-indexes/4
        indexArray = _sortIndexArray.slice(0, length);
        // sort the indexes only
        this._sort.call(indexArray, function(e1, e2) {
            return compareFunction(self[e1], self[e2]);
        });

        descriptor = ChangeNotification.getPropertyChangeDescriptor(this, null);
        indexNotification = Object.create(PropertyChangeNotification);
        indexNotification.target = this;

        if (descriptor) {
            notification = Object.create(PropertyChangeNotification);
            notification.target = this;
            notification.isMutation = true;
            descriptor.handleWillChange(notification);
        }

        for (var i = 0; i < length; i++) {
            indexArray[i] = this[indexArray[i]];
            indexDescriptor = ChangeNotification.getPropertyChangeDescriptor(this, i);
            if (indexDescriptor) {
                oldValue = this[i];
                if (oldValue !== indexArray[i]) {
                    indexNotification.index = i;
                    indexNotification.propertyPath = String(i);
                    indexNotification.minus = oldValue;
                    indexDescriptor.handleWillChange(indexNotification);
                }
            }
        }

        for (var i = 0; i < length; i++) {
            indexDescriptor = ChangeNotification.getPropertyChangeDescriptor(this, i);
            if (indexDescriptor) {
                oldValue = this[i];
                newValue = indexArray[i];
                this[i] = indexArray[i];
                if (oldValue !== newValue) {
                    indexNotification.index = i;
                    indexNotification.propertyPath = String(i);
                    indexNotification.minus = oldValue;
                    indexNotification.plus = newValue;
                    indexDescriptor.handleChange(indexNotification);
                }
            } else {
                this[i] = indexArray[i];
            }
        }

        if (descriptor) {
            // nothing was really added or removed...
            notification.minus = notification.plus = [];
            descriptor.handleChange(notification);
        }
    }
});

Object.defineProperty(ChangeNotificationDispatchingArray, "_clear", {
    enumerable: false,
    configurable: true,
    value: Array.prototype.clear
});

/**
 Removes all members of this array making the object suitable for reuse
 @function module:montage/core/core.Array.clear
 */
Object.defineProperty(ChangeNotificationDispatchingArray, "clear", {
    enumerable: false,
    configurable: true,
    value: function() {
        this._dispatchArrayChangeNotification("_clear", arguments, this.length, 0, Array.prototype.slice.call(arguments, 0));
        return this;
    }
});

if (typeof define === "function") {
// ugly code is ugly
Object.defineProperty(Object.prototype, "__debugChangeNotifications__", {
    enumerable: false,
    configurable: false,
    value: function() {
        var registry = ChangeNotification._descriptorsRegistry[this.uuid],
            path,
            log = [];

        if (registry) {
            for (path in registry) {
                log.push('"'+path+'"', registry[path]);

                var dependencies = registry[path].dependencies;
                if (dependencies) {
                    log.push("\n\tlistens to ");
                    for (var i = 0; i < dependencies.length; i += 3) {
                        if (dependencies[i+1] == null) {
                            log.push("mutation @", dependencies[i]);
                        } else {
                            log.push("\"" + dependencies[i+1] + "\" @", dependencies[i]);
                        }
                        log.push("\n\t           ");
                    }
                    log.pop();
                }

                var changeListeners = registry[path].changeListeners;
                var bindings = [];
                for (var key in changeListeners) {
                    var listenerTarget = changeListeners[key].listenerTarget;
                    var listenerFunctionName = changeListeners[key].listenerFunctionName;
                    var info = Montage.getInfoForObject(listenerTarget);
                    if (info.objectName === "PropertyChangeBindingListener") {
                        if (listenerTarget.bindingOrigin === this && listenerTarget.bindingPropertyPath === path) {
                            bindings.push("\"" + listenerTarget.targetPropertyPath + "\" @ " + (Montage.getInfoForObject(listenerTarget.target).objectName || "<object>") + "(", listenerTarget.target, ")");
                        } else {
                            bindings.push("\"" + listenerTarget.bindingPropertyPath + "\" @ " + (Montage.getInfoForObject(listenerTarget.bindingOrigin).objectName || "<object>") + "(", listenerTarget.bindingOrigin, ")");
                        }

                        bindings.push("\n\t            ");
                    }
                }

                var listeners = [];
                (function gatherListeners(descriptor, withBindings) {
                    var changeListeners = descriptor.changeListeners;
                    for (var key in changeListeners) {
                        var listenerTarget = changeListeners[key].listenerTarget,
                            listenerFunctionName = changeListeners[key].listenerFunctionName,
                            info = Montage.getInfoForObject(listenerTarget);

                        if (info.objectName !== "PropertyChangeBindingListener") {
                            if (descriptor.dependentDescriptorsIndex && key in descriptor.dependentDescriptorsIndex) {
                                listeners.push('"'+listenerTarget.propertyPath + "\" (", listenerTarget ,")", "-> ");

                            } else {
                                listeners.push(listenerFunctionName ? listenerFunctionName : "<function>", "@ " + info.objectName + " (", listenerTarget, ")");
                            }
                            gatherListeners(listenerTarget, true);
                            listeners.push("\n\t               ");
                        } else if (withBindings) {
                            listeners.push("\"" + listenerTarget.bindingPropertyPath + "\" @ " + Montage.getInfoForObject(listenerTarget.bindingOrigin).objectName + "(", listenerTarget.bindingOrigin, ")");
                        }
                    }
                })(registry[path]);

                if (listeners.length > 0) {
                    listeners.pop();
                    log.push("\n\tis listened by ");
                    log.push.apply(log, listeners);
                }
                if (bindings.length > 0) {
                    bindings.pop();
                    log.push("\n\tis bound to ");
                    log.push.apply(log, bindings);
                }

                log.push("\n\n");
            }

            console.log.apply(console, log);
        } else {
            console.log("No change listeners installed.");
        }
    }
});
}
