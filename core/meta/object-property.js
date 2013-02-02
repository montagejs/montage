"use strict";
/**
 @module montage/data/object-property
 @requires montage/data/pledge
 @requires montage/core/core
 @requires montage/core/exception
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Exception = require("core/exception").Exception;
var Blueprint = require("core/meta/blueprint").Blueprint;
var Binder = require("core/meta/blueprint").Binder;

var logger = require("core/logger").logger("object-property");

/**
 @class module:montage/core/meta/object-property.ObjectProperty
 @extends module:montage/core/core.Montage
 */
var ObjectProperty = exports.ObjectProperty = Montage.create(Montage, /** @lends module:montage/core/meta/object-property.ObjectProperty# */ {
    /**
     Description TODO
     @function
     @returns itself
     */
    init:{
        serializable:false,
        enumerable:false,
        value:function () {
            return this;
        }
    },

    /**
     Add all the properties defined in the blueprint to the target prototype.<br>
     If the blueprint is null, this method will make a best attempt to locate it.
     @function
     @param {Property} prototype TODO
     @param {Object} blueprint TODO
     */
    apply:{
        value:function (prototype, blueprint) {
            if (!prototype.hasOwnProperty("blueprint")) {
                var info;
                info = Montage.getInfoForObject(prototype);
                if (info != null && info.isInstance === false) {
                    if (typeof blueprint === "undefined") {
                        blueprint = Binder.manager.blueprintForPrototype(info.objectName, info.moduleId);
                    } else if ((blueprint.prototypeName !== info.objectName) || (blueprint.moduleId !== info.moduleId)) {
                        // Something is wrong, the hierarchies are out of wack
                        blueprint = null;
                    }
                    this.applyWithBlueprint(prototype, blueprint);
                }
            }
        }
    },

    /**
     Add all the properties defined in the blueprint to the target prototype.<br/>
     <b>Note:<b/>This method will explore the blueprint hierarchy recursively.
     @function
     @param {Property} prototype TODO
     @param {Object} blueprint TODO
     */
    applyWithBlueprint:{
        value:function (prototype, blueprint) {
            if (blueprint != null) {
                this.addProperties(prototype, blueprint);
                if (blueprint.parent !== null) {
                    this.apply(Object.getPrototypeOf(prototype), blueprint);
                }
            }
        }
    },
    /**
     Add all the properties defined in the blueprint to the target prototype.
     @function
     @param {Property} prototype TODO
     @param {Object} blueprint TODO
     */
    addProperties:{
        value:function (prototype, blueprint) {
            //for loop over attributes
            var i = 0, attribute;
            while ((attribute = blueprint.propertyBlueprints[i++])) {
                if (attribute.isDerived) {
                    this.addDerivedProperty(prototype, attribute);
                } else if (attribute.isAssociation) {
                    this.addAssociation(prototype, attribute);
                } else {
                    this.addProperty(prototype, attribute);
                }
            }

            Montage.defineProperty(prototype, "_blueprint", { serializable:false, enumerable:false, value:blueprint });
            Montage.defineProperty(prototype, "blueprint", { enumerable:false, serializable:false, get:function () {
                return this._blueprint;
            }});
            // Enable access to the 'inherited' get method for easy override.
            Montage.defineProperty(prototype, "blueprintGet", { serializable:false, enumerable:false, value:this.blueprintGet});
            // Enable access to the 'inherited' set method for easy override.
            Montage.defineProperty(prototype, "blueprintSet", { serializable:false, enumerable:false, value:this.blueprintSet});
        }
    },
    /**
     Add one property defined in the attribute to the target prototype.
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addProperty:{
        value:function (prototype, attribute) {
            this.addPropertyStorage(prototype, attribute);
            this.addPropertyDefinition(prototype, attribute);
            this.addPropertyStoredValue(prototype, attribute);
        }
    },
    /**
     Description TODO
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addPropertyStorage:{
        value:function (prototype, attribute) {
            var storageKey = "_" + attribute.name,
                storageDefinition = null;
            if (!prototype.hasOwnProperty(storageKey)) {
                if (attribute.isToMany) {
                    storageDefinition = {
                        value:[],
                        enumerable:false,
                        serializable:true,
                        distinct:true
                    };
                } else {
                    storageDefinition = {
                        value:null,
                        enumerable:false,
                        serializable:true
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
     Description TODO
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addPropertyDefinition:{
        value:function (prototype, attribute) {
            var propertyKey = attribute.name,
                propertyDefinition = null;
            if (!prototype.hasOwnProperty(propertyKey)) {
                propertyDefinition = {
                    get:function () {
                        return this.blueprintGet(propertyKey);
                    },
                    enumerable:true,
                    serializable:false
                };
                if (!attribute.readOnly) {
                    propertyDefinition.set = function (value) {
                        return this.blueprintSet(propertyKey, value);
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
     This is the get function called on the target object to access properties.<br>
     @function
     @param {Object} propertyName TODO
     @returns {Array} [storageKey]
     */
    blueprintGet:{
        value:function (propertyName) {
            var propertyBlueprint = this.blueprint.propertyBlueprintForName(propertyName);
            var storageKey = "_" + propertyBlueprint.name;
            return this[storageKey];
        },
        enumerable:false,
        serializable:false
    },

    /**
     This is the get function called on the target object to set properties.<br>
     @function
     @param {Object} propertyName TODO
     @param {Property} value TODO
     @returns {Array} [storageKey]
     */
    blueprintSet:{
        value:function (propertyName, value) {
            var propertyBlueprint = this.blueprint.propertyBlueprintForName(propertyName);
            var storageKey = "_" + propertyBlueprint.name;
            if (value == null && propertyBlueprint.denyDelete) {
                throw Exception.create().initWithMessageTargetAndMethod("Deny Delete", this, propertyBlueprint.name);
            } else {
                this[storageKey] = value;
            }
        },
        enumerable:false,
        serializable:false
    },

    /**
     Description TODO
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addPropertyStoredValue:{
        value:function (prototype, attribute) {
            var storedValueKey = attribute.name + "$Storage",
                storedValueDefinition = null;
            if (!prototype.hasOwnProperty(storedValueKey)) {
                if (attribute.isToMany) {
                    storedValueDefinition = {
                        value:[],
                        enumerable:false,
                        serializable:false,
                        distinct:true
                    };
                } else {
                    storedValueDefinition = {
                        value:null,
                        enumerable:false,
                        serializable:false
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
     Adds a relationship management methods to the managed object.
     @function
     @param {Property} prototype TODO
     @param {Object} attribute relationship to add
     */
    addAssociation:{
        value:function (prototype, attribute) {
            this.addPropertyStorage(prototype, attribute);
            this.addAssociationDefinition(prototype, attribute);
            this.addPropertyStoredValue(prototype, attribute);
        }
    },


    /**
     Description TODO
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addAssociationDefinition:{
        value:function (prototype, attribute) {
            if (attribute.isToMany) {
                this.addToManyAssociationDefinition(prototype, attribute);
            } else {
                this.addToOneAssociationDefinition(prototype, attribute);
            }
        }
    },

    /**
     Description TODO
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addToOneAssociationDefinition:{
        value:function (prototype, attribute) {
            var relationshipKey = attribute.name.toCapitalized();
            var key = "addTo" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable:false, enumerable:false, value:function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "removeFrom" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable:false, enumerable:false, value:function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "clear" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable:false, enumerable:false, value:function () {
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
     Description TODO
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addToManyAssociationDefinition:{
        value:function (prototype, attribute) {
            var relationshipKey = attribute.name.toCapitalized();
            var key = "addTo" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable:false, enumerable:false, value:function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "removeFrom" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable:false, enumerable:false, value:function () {
                    return null;
                }});
            } else {
                if (logger.isError) {
                    logger.error("We have an issue here. The developer should not override the method " + key + ".");
                }
            }
            key = "clear" + relationshipKey;
            if (!prototype.hasOwnProperty(key)) {
                Montage.defineProperty(prototype, key, { serializable:false, enumerable:false, value:function () {
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
     Adds a derived attribute to the managed object.
     @function
     @param {Property} prototype TODO
     @param {Object} attribute TODO
     */
    addDerivedProperty:{
        value:function (prototype, attribute) {
        }
    }

});
