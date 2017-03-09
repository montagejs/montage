
/**
 * @module montage/data/object-property
 * @requires montage/data/pledge
 * @requires montage/core/core
 * @requires montage/core/exception
 * @requires montage/core/logger
 */
var Montage = require("../core").Montage,
    Exception = require("../exception").Exception,
    Model = require("./model").Model,
    deprecate = require("../deprecate"),
    logger = require("../logger").logger("object-property");

/**
 * @class ObjectProperty
 * @extends Montage
 */
exports.ObjectProperty = Montage.specialize( /** @lends ObjectProperty# */ {

    /**
     * @function
     * @returns itself
     */
    init: {
        serializable: false,
        enumerable: false,
        value: function () {
            return this;
        }
    },

    /**
     * Add all the properties defined in the object descriptor to the target prototype.
     *
     * If the object descriptor is null, this method will make a best attempt to locate
     * it.
     *
     * @function
     * @param {Object} prototype
     * @param {Blueprint} blueprint
     */
    apply: {
        value: function (prototype, objectDescriptor) {
            var info;
            if (!prototype.hasOwnProperty("objectDescriptor")) {
                info = Montage.getInfoForObject(prototype);
                if (info != null && info.isInstance === false) {
                    if (objectDescriptor === undefined) {
                        objectDescriptor = Model.group.objectDescriptorForPrototype(info.objectName, info.moduleId);
                    } else if (objectDescriptor.prototypeName !== info.objectName || objectDescriptor.moduleId !== info.moduleId) {
                        // Something is wrong, the hierarchies are out of whack
                        objectDescriptor = null;
                    }
                    this.applyWithObjectDescriptor(prototype, objectDescriptor);
                }
            }
        }
    },

    /**
     * Add all the properties defined in the blueprint to the target prototype.
     *
     * **Note:** This method will explore the blueprint hierarchy recursively.
     *
     * @function
     * @param {Object} prototype
     * @param {Blueprint} blueprint
     */
    applyWithBlueprint: {
        value: deprecate.deprecateMethod(void 0, function (prototype, objectDescriptor) {
            return this.applyWithObjectDescriptor(prototype, objectDescriptor);
        }, "applyWithBlueprint", "applyWithObjectDescriptor")
    },

    applyWithObjectDescriptor: {
        value: function (prototype, objectDescriptor) {
            if (objectDescriptor != null) {
                this.addProperties(prototype, objectDescriptor);
                if (objectDescriptor.parent !== null) {
                    this.apply(Object.getPrototypeOf(prototype), objectDescriptor);
                }
            }
        }
    },

    /**
     * Add all the properties defined in the blueprint to the target prototype.
     *
     * @function
     * @param {Object} prototype
     * @param {Blueprint} blueprint
     */
    addProperties: {
        value: function (prototype, objectDescriptor) {
            //for loop over attributes
            var i = 0, attribute;
            while ((attribute = objectDescriptor.propertyDescriptors[i++])) {
                if (attribute.isDerived) {
                    this.addDerivedProperty(prototype, attribute);
                } else if (attribute.isAssociation) {
                    // TODO: How to handle this?
                    this.addAssociation(prototype, attribute);
                } else {
                    this.addProperty(prototype, attribute);
                }
            }

            // For backwards compatibility.
            Montage.defineProperty(prototype, "blueprint", { enumerable: false, serializable: false, get: function () {
                return this._objectDescriptor;
            }});
            Montage.defineProperty(prototype, "_objectDescriptor", { serializable: false, enumerable: false, value: objectDescriptor });
            Montage.defineProperty(prototype, "objectDescriptor", { enumerable: false, serializable: false, get: function () {
                return this._objectDescriptor;
            }});
            // TODO: Determine if it is safe to remove blueprintGet && blueprintSet?
            // Enable access to the 'inherited' get method for easy override.
            Montage.defineProperty(prototype, "blueprintGet", { serializable: false, enumerable: false, value: this.objectDescriptorGet});
            // Enable access to the 'inherited' set method for easy override.
            Montage.defineProperty(prototype, "blueprintSet", { serializable: false, enumerable: false, value: this.objectDescriptorSet});
            // Enable access to the 'inherited' get method for easy override.
            Montage.defineProperty(prototype, "objectDescriptorGet", { serializable: false, enumerable: false, value: this.objectDescriptorGet});
            // Enable access to the 'inherited' set method for easy override.
            Montage.defineProperty(prototype, "objectDescriptorSet", { serializable: false, enumerable: false, value: this.objectDescriptorSet});
        }
    },

    /**
     * Add one property defined in the attribute to the target prototype.
     *
     * @function
     * @param {Prototype} prototype
     * @param {Attribute} attribute
     */
    addProperty: {
        value: function (prototype, attribute) {
            this.addPropertyStorage(prototype, attribute);
            this.addPropertyDefinition(prototype, attribute);
            this.addPropertyStoredValue(prototype, attribute);
        }
    },

    /**
     * @function
     * @param {Object} prototype
     * @param {Attribute} attribute
     */
    addPropertyStorage: {
        value: function (prototype, attribute) {
            var storageKey = "_" + attribute.name,
                lazyStorageKey = "_" + storageKey,
                storageDefinition = null;
            if (!prototype.hasOwnProperty(storageKey)) {
                if (attribute.isToMany) {
                    Montage.defineProperty(prototype, lazyStorageKey, {
                        value: null,
                        enumerable: false,
                        serializable: false
                    });
                    storageDefinition = {
                        get: function() {
                            return this[lazyStorageKey] || (this[lazyStorageKey] = []);
                        },
                        enumerable: false,
                        serializable: true
                    };
                } else {
                    storageDefinition = {
                        value: null,
                        enumerable: false,
                        serializable: true
                    };
                }
                Montage.defineProperty(prototype, storageKey, storageDefinition);
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the storage value for " + storageKey + ".");
                }
            }
        }
    },

    /**
     * @function
     * @param {Property} prototype TODO
     * @param {Object} attribute TODO
     */
    addPropertyDefinition: {
        value: function (prototype, attribute) {
            var propertyKey = attribute.name,
                propertyDefinition = null;
            if (!prototype.hasOwnProperty(propertyKey)) {
                propertyDefinition = {
                    get: function () {
                        return this.objectDescriptorGet(propertyKey);
                    },
                    enumerable: true,
                    serializable: false
                };
                if (!attribute.readOnly) {
                    propertyDefinition.set = function (value) {
                        return this.objectDescriptorSet(propertyKey, value);
                    };
                }
                Montage.defineProperty(prototype, propertyKey, propertyDefinition);
            } else {
                if (logger.isDebug) {
                    logger.debug("The developer has already created the property " + propertyKey + " method do nothing.");
                }
            }
        }
    },

    /**
     * This is the get function called on the target object to access
     * properties.
     *
     * @function
     * @param {string} propertyName
     * @returns {PropertyDescriptor}
     */
    blueprintGet: {
        value: deprecate.deprecateMethod(void 0, function (propertyName) {
            return this.objectDescriptorGet(propertyName);
        }, "blueprintGet", "objectDescriptorGet"),
        enumerable: false,
        serializable: false
    },

    /**
     * This is the get function called on the target object to access
     * properties.
     *
     * @function
     * @param {string} propertyName
     * @returns {PropertyDescriptor}
     */
    objectDescriptorGet: {
        value: function (propertyName) {
            var propertyDescriptor = this.objectDescriptor.propertyDescriptorForName(propertyName),
                storageKey = "_" + propertyDescriptor.name;
            return this[storageKey];
        },
        enumerable: false,
        serializable: false
    },

    /**
     * This is the get function called on the target object to set
     * properties.
     *
     * @function
     * @param {string} propertyName
     * @param {PropertyBlueprint} value
     */
    blueprintSet: {
        value: deprecate.deprecateMethod(void 0, function (propertyName, value) {
            return this.objectDescriptorSet(propertyName, value);
        }, "blueprintSet", "objectDescriptorSet"),
        enumerable: false,
        serializable: false
    },

    /**
     * This is the get function called on the target object to set
     * properties.
     *
     * @function
     * @param {string} propertyName
     * @param {PropertyDescriptor} value
     */
    objectDescriptorSet: {
        value: function (propertyName, value) {
            var propertyDescriptor = this.objectDescriptor.propertyDescriptorForName(propertyName),
                storageKey = "_" + propertyDescriptor.name;
            if (value == null && propertyDescriptor.denyDelete) {
                throw new Exception().initWithMessageTargetAndMethod("Deny Delete", this, propertyDescriptor.name);
            } else {
                this[storageKey] = value;
            }
        },
        enumerable: false,
        serializable: false
    },

    /**
     * @function
     * @param {Object} prototype
     * @param {Attribute} attribute
     */
    addPropertyStoredValue: {
        value: function (prototype, attribute) {
            var storedValueKey = attribute.name + "$Storage",
                privateStoredValueKey = "_" + storedValueKey,
                storedValueDefinition = null;
            if (!prototype.hasOwnProperty(storedValueKey)) {
                if (attribute.isToMany) {
                    Montage.defineProperty(prototype, privateStoredValueKey, {
                        value: null,
                        enumerable: false,
                        serializable: false
                    });
                    storedValueDefinition = {
                        get: function() {
                            return this[privateStoredValueKey] || (this[privateStoredValueKey] = []);
                        },
                        enumerable: false,
                        serializable: false
                    };
                } else {
                    storedValueDefinition = {
                        value: null,
                        enumerable: false,
                        serializable: false
                    };
                }
                Montage.defineProperty(prototype, storedValueKey, storedValueDefinition);
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the stored value for " + storedValueKey + ".");
                }
            }
        }
    },

    /**
     * Adds a relationship management methods to the managed object.
     * @function
     * @param {Object} prototype
     * @param {Attribute} attribute relationship to add
     */
    // TODO: Part of deprecating associations in preference to property descriptor with a value descriptor.
    addAssociation: {
        value: function (prototype, attribute) {
            this.addPropertyStorage(prototype, attribute);
            this.addAssociationDefinition(prototype, attribute);
            this.addPropertyStoredValue(prototype, attribute);
        }
    },


    /**
     * @function
     * @param {Object} prototype
     * @param {Attribute} attribute
     */
    // TODO: Part of deprecating associations in preference to property descriptor with a value descriptor.
    addAssociationDefinition: {
        value: function (prototype, attribute) {
            if (attribute.isToMany) {
                this.addToManyAssociationDefinition(prototype, attribute);
            } else {
                this.addToOneAssociationDefinition(prototype, attribute);
            }
        }
    },

    /**
     * @function
     * @param {Object} prototype
     * @param {Attribute} attribute
     */
    // TODO: Part of deprecating associations in preference to property descriptor with a value descriptor.
    addToOneAssociationDefinition: {
        value: function (prototype, attribute) {
            var relationshipKey = attribute.name.toCapitalized();
            var key = "addTo" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable: false, enumerable: false, value: function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "removeFrom" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable: false, enumerable: false, value: function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "clear" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable: false, enumerable: false, value: function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
        }
    },

    /**
     * @function
     * @param {Object} prototype
     * @param {Association} attribute
     */
    // TODO: Part of deprecating associations in preference to property descriptor with a value descriptor.
    addToManyAssociationDefinition: {
        value: function (prototype, attribute) {
            var relationshipKey = attribute.name.toCapitalized();
            var key = "addTo" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable: false, enumerable: false, value: function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "removeFrom" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable: false, enumerable: false, value: function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "clear" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable: false, enumerable: false, value: function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
        }
    },

    /**
     * Adds a derived attribute to the managed object.
     * @function
     * @param {Object} prototype
     * @param {Attribute} attribute
     */
    addDerivedProperty: {
        value: function (prototype, attribute) {
        }
    }

});
