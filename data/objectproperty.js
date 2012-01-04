/*
<copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright>
*/
/**
	@module montage/data/objectproperty
    @requires montage/core/core
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Pledge = require("data/pledge").Pledge;
var PledgedSortedSet = require("data/pledge").PledgedSortedSet;
var logger = require("core/logger").logger("objectproperty");
/**
  Description TODO
  @private
*/
var _objectPropertyManager = null;
/**
    @class module:montage/data/objectproperty.ObjectProperty
    @extends module:montage/core/core.Montage
*/
var ObjectProperty = exports.ObjectProperty = Montage.create(Montage,/** @lends module:montage/data/objectproperty.ObjectProperty# */ {
/**
    Description TODO
    @function
    @returns itself
    */
    init: {
        serializable: false,
        enumerable: false,
        value: function() {
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
    apply: {
        value: function(prototype, blueprint) {
            if (! prototype.hasOwnProperty("blueprint")) {
                var info;
                info = Montage.getInfoForObject(prototype);
                if (info != null && info.isInstance === false) {
                    if (typeof blueprint === "undefined") {
                        blueprint = Store.defaultManager.blueprintForPrototype(info.objectName, info.moduleId);
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
    Add all the properties defined in the blueprint to the target prototype.
    @function
    @param {Property} prototype TODO
    @param {Object} blueprint TODO
    */
    applyWithBlueprint: {
        value: function(prototype, blueprint) {
            if (blueprint != null) {
                this.addProperties(prototype, blueprint);
                if (blueprint.parent !== null) {
                    this.apply(Object.getPrototypeOf(prototype), blueprint);
                }
            }
        }
    },
/**
    Description TODO
    @function
    @param {Property} prototype TODO
    @param {Object} blueprint TODO
    */
    addProperties: {
        value: function(prototype, blueprint) {
            //for loop over attributes
            var i, attribute;
            for (i = 0; attribute = blueprint.attributes[i]; i++) {
                if (attribute.isDerived) {
                    this.addDerivedProperty(prototype, attribute);
                } else {
                    this.addProperty(prototype, attribute);
                }
            }

            Montage.defineProperty(prototype, "context", { serializable: false, enumerable: true, value: null });
            Montage.defineProperty(prototype, "_objectId", { serializable: true, enumerable: false, value: null });
            Montage.defineProperty(prototype, "objectId", {
                enumerable: true,
                serializable: false,
                get: function() {
                    if (this._objectId === null) {
                        this._objectId = this.blueprint.objectId$Implementation;
                    }
                    return this._objectId;
                },
                set: function(value) {
                    if (value !== null) {
                        this._objectId = value;
                    } else {
                        throw Exception.create().initWithMessageTargetAndMethod("Cannot set object Id to null", this, "objectId.set");
                    }
                }
            });
            Montage.defineProperty(prototype, "_blueprint", { serializable: false, enumerable: false, value: blueprint });
            Montage.defineProperty(prototype, "blueprint", { enumerable: false, serializable: false, get: function() {
                return this._blueprint;
            }});
            Montage.defineProperty(prototype, "isPledge", { serializable: false, enumerable: true, value: false });
            Montage.defineProperty(prototype, "withProperties", { serializable: false, enumerable: false, value: function() {
                return null;
            }});
            Montage.defineProperty(prototype, "willRead", { serializable: false, enumerable: false, value: this.willRead });
            Montage.defineProperty(prototype, "willModify", { serializable: false, enumerable: false, value: this.willModify });
            // Enable access to the 'inherited' get method for easy override.
            Montage.defineProperty(prototype, "blueprintGet", { serializable: false, enumerable: false, value: blueprint.blueprintGet});
            // Enable access to the 'inherited' set method for easy override.
            Montage.defineProperty(prototype, "blueprintSet", { serializable: false, enumerable: false, value: blueprint.blueprintSet});
            // Provide a storage property for any state the access layer need to store in teh object. This would typically be a database snapshot reference.
            Montage.defineProperty(prototype, "_opaqueAccessState", { serializable: false, enumerable: false, value: null});
        }
    },
/**
    Description TODO
    @function
    @param {Property} prototype TODO
    @param {Object} attribute TODO
    */
    addProperty: {
        value: function(prototype, attribute) {
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
    addPropertyStorage: {
        value: function(prototype, attribute) {
            var storageKey = "_" + attribute.name,
                storageDefinition = null;
            if (! prototype.hasOwnProperty(storageKey)) {
                if (attribute.isToMany) {
                    storageDefinition = {
                        value: [],
                        enumerable: false,
                        serializable: true,
                        distinct: true
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
                // We have an issue here. The developer should not override the storage value.
            }
        }
    },
/**
    Description TODO
    @function
    @param {Property} prototype TODO
    @param {Object} attribute TODO
    */
    addPropertyDefinition: {
        value : function(prototype, attribute) {
            var propertyKey = attribute.name,
                propertyDefinition = null;
            if (! prototype.hasOwnProperty(propertyKey)) {
                propertyDefinition = {
                    get: function() {
                        return this.blueprintGet(propertyKey);
                    },
                    enumerable: true,
                    serializable: false
                };
                if (! attribute.readOnly) {
                    propertyDefinition.set = function(value) {
                        return this.blueprintSet(propertyKey, value);
                    };
                }
                Montage.defineProperty(prototype, propertyKey, propertyDefinition);
            } else {
                // The developer has already created the property method do nothing.
            }
        }
    },
/**
    Description TODO
    @function
    @param {Property} prototype TODO
    @param {Object} attribute TODO
    */
    addPropertyStoredValue: {
        value: function(prototype, attribute) {
            var storedValueKey = attribute.name + "$Storage",
                storedValueDefinition = null;
            if (! prototype.hasOwnProperty(storedValueKey)) {
                if (attribute.isToMany) {
                    storedValueDefinition = {
                        value: [],
                        enumerable: false,
                        serializable: false,
                        distinct: true
                    }
                } else {
                    storedValueDefinition = {
                        value: null,
                        enumerable: false,
                        serializable: false
                    }
                }
                Montage.defineProperty(prototype, storedValueKey, storedValueDefinition);
            } else {
                // We have an issue here. The developer should not override the stored value.
            }
        }
    },
/**
    Description TODO
    @function
    @param {Property} prototype TODO
    @param {Object} attribute TODO
    */
    addDerivedProperty: {
        value: function(prototype, attribute) {
        }
    },

/**
    Description TODO
    @function
    @param {Object} attribute TODO
    */
    willRead: {
        value: function(attribute) {
            var storageKey = "_" + attribute.name;
            if (typeof this[storageKey] !== 'undefined') {
                // the property is already resolved nothing to do.
                return;
            }
            if ((typeof this.context !== 'undefined') && (this.context !== null)) {
                this.context.fulfillPropertyForInstance(attribute, this);
            }
        }
    },
/**
    Description TODO
    @function
    @param {Object} attribute TODO
    @param {Property} value TODO
    */
    willModify: {
        value: function(attribute, value) {
            var storageKey = "_" + attribute.name;
            var previousValue = this[storageKey];
            if ((typeof previousValue === 'undefined') || (previousValue !== value)) {
                if ((typeof this.context !== 'undefined') && (this.context !== null)) {
                    this.context.willModifyPropertyForInstance(attribute, this);
                }
            }
        }
    },
    /**
    Returns the transaction manager.<br>
    The transaction manager is a unique object in charge of openning and closing transactions.
    @function
    @returns object
    */
    manager: {
        get: function() {
            if (_objectPropertyManager === null) {
                _objectPropertyManager = Object.freeze(ObjectProperty.create().init());
            }
            return _objectPropertyManager;
        }
    }

});
