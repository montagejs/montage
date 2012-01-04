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
	@module montage/data/blueprint
    @requires montage/core/core
    @requires montage/data/store
    @requires montage/data/objectid
    @requires data/query
    @requires core/exception
    @requires data/objectproperty
    @requires core/promise
    @requires core/logger
*/
var Montage = require("montage").Montage;
var Store = require("data/store").Store;
var TemporaryObjectId = require("data/objectid").TemporaryObjectId;
var Query = require("data/query").Query;
var Exception = require("core/exception").Exception;
var ObjectProperty = require("data/objectproperty").ObjectProperty;
var Promise = require("core/promise").Promise;
var logger = require("core/logger").logger("blueprint");
/**
    @class module:montage/data/blueprint.BlueprintBinder
    @classdesc A blueprint binder is a collection of of blueprints for a specific access type. It also includes the connection information.
    @extends module:montage/core/core.Montage
*/
var BlueprintBinder = exports.BlueprintBinder = Montage.create(Montage,/** @lends module:montage/data/blueprint.BlueprintBinder# */ {

/**
  Description TODO
  @private
*/
    _blueprintForPrototypeTable: {
        value: {},
        serializable: false,
        distinct: true,
        enumerable: false,
        writable: false
    },
/**
        Description TODO
        @type {Property}
        @default {Table} {}
    */
    restrictionsTable: {
        value: {},
        serializable: true,
        distinct: true,
        enumerable: false,
        writable: false
    },
/**
        Description TODO
        @type {Property}
        @default {String} null
    */
    name: {
        value: null,
        serializable: true
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @returns itself
    */
    initWithName: {
        value: function(name) {
            this.name = (name !== null ? name : "default");
            return this;
        }
    },
/**
        Description TODO
        @type {Property}
        @default {Array} new Array(30)
    */
    blueprints: {
        serializable: true,
        distinct: true,
        writable: false,
        value: new Array(30)
    },
/**
    Description TODO
    @function
    @param {Array} blueprint TODO
    @returns blueprint
    */
    addBlueprint: {
        value: function(blueprint) {
            if (blueprint !== null) {
                var index = this.blueprints.indexOf(blueprint);
                if (index < 0) {
                    if (blueprint.binder !== null) {
                        blueprint.binder.removeBlueprint(blueprint);
                    }
                    this.blueprints.push(blueprint);
                    blueprint.binder = this;
                    //
                    var key = blueprint.moduleId + "." + blueprint.prototypeName;
                    this._blueprintForPrototypeTable[key] = blueprint;
                }
            }
            return blueprint;
        }
    },
/**
    Description TODO
    @function
    @param {Array} blueprint TODO
    @returns blueprint
    */
    removeBlueprint: {
        value: function(blueprint) {
            if (blueprint !== null) {
                var index = this.blueprints.indexOf(blueprint);
                if (index >= 0) {
                    this.blueprints.splice(index, 1);
                    blueprint.binder = null;
                    // Remove the cached entry
                    var key = blueprint.moduleId + "." + blueprint.prototypeName;
                    delete this._blueprintForPrototypeTable[key];
                }
            }
            return blueprint;
        }
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @param {String} moduleID TODO
    @returns this.addBlueprint(this.createBlueprint().initWithNameAndModuleId(name, moduleId))
    */
    addBlueprintNamed : {
        value: function(name, moduleId) {
            return this.addBlueprint(this.createBlueprint().initWithNameAndModuleId(name, moduleId));
        }
    },
/**
    Description TODO
    @function
    @returns Blueprint.create()
    */
    createBlueprint: {
        value: function() {
            return Blueprint.create();
        }
    },
/**
    Description TODO
    @function
    @param {String} name  TODO
    @param {Selector} defaultSelector TODO
    @returns restriction
    */
    addRestriction: {
        value: function(name, defaultSelector) {
            var restriction = null;
            if (name != null && defaultSelector != null) {
                restriction = this.restrictionsTable[name] = defaultSelector;
            }
            return restriction;
        }
    },
/**
    Description TODO
    @function
    @param {String} name  TODO
    @returns restriction
    */
    removeRestriction: {
        value: function(name) {
            if (name !== null) {
                var restriction = this.restrictionsTable[name]
                if (restriction != null) {
                    delete restriction;
                }
            }
            return restriction;
        }
    },

/**
    Description TODO
    @function
    @param {String} restriction  TODO
    @returns selector
    */
    defaultSelectorForRestriction: {
        value: function(restriction) {
            var selector = null;
            if (restriction != null) {
                selector = this.restrictionsTable[restriction.name];
                if (typeof selector === 'undefined') {
                    selector = null;
                }
            }
            return selector;
        }
    },
 /**
        Description TODO
        @type {Property}
        @default {ID} montage/data/store
    */
    storeModuleId: {
        value: "data/store"
    },
    /**
        Description TODO
        @type {Property}
        @default {String} "Store"
    */
    storePrototypeName: {
        value: "Store"
    },
    /**
    Return the blueprint associated with this prototype.
    @function
    @param {String} prototypeName TODO
    @param {ID} moduleId TODO
    @returns blueprint
    */
    blueprintForPrototype: {
        value: function(prototypeName, moduleId) {
            var key = moduleId + "." + prototypeName;
            var blueprint = this._blueprintForPrototypeTable[key];
            if (typeof blueprint === "undefined") {
                blueprint = UnknownBlueprint;
                var aBlueprint, index;
                for (index = 0; typeof (aBlueprint = this.blueprints[index]) !== "undefined"; index++) {
                    if ((aBlueprint.prototypeName === prototypeName) && (aBlueprint.moduleId === moduleId)) {
                        blueprint = aBlueprint;
                        break;
                    }
                }
                this._blueprintForPrototypeTable[key] = blueprint;
            }
            if (blueprint === UnknownBlueprint) {
                blueprint = null;
            }
            return blueprint;
        }
    }

});
/**
    @class module:montage/data/bluprint.Blueprint
*/
var Blueprint = exports.Blueprint = Montage.create(Montage,/** @lends module:montage/data/bluprint.Blueprint# */ {
    /**
    This is the canonical way of creating managed objects prototypes.<br>
    Newly created prototype will be blessed with all the required properties to be well behaved.
    @function
    @param {Object} aPrototype TODO
    @param {String} propertyDescriptor TODO
    @returns newPrototype
    */
    create: {
        configurable: true,
        value: function(aPrototype, propertyDescriptor) {
            if ((typeof aPrototype === 'undefined') || (Blueprint.isPrototypeOf(aPrototype))) {
                var parentCreate = Object.getPrototypeOf(Blueprint)["create"];
                return parentCreate.call(this, (typeof aPrototype === "undefined" ? this : aPrototype), propertyDescriptor);
            }
            var newPrototype = Montage.create(aPrototype, propertyDescriptor);
            ObjectProperty.manager.applyWithBlueprint(newPrototype, this);
            // We have just created a custom prototype lets use it.
            this.customPrototype = true;
            return newPrototype;
        }
    },
/**
    Create a new instance of the target prototype for the blueprint.
    @function
    @return new instance
    */
    newInstance: {
        value: function() {
            var prototype = this.newInstancePrototype();
            return (prototype ? prototype.create() : null);
        }
    },
 /**
    Returns the target prototype for this blueprint.<br>
    <b>Note:</b> This method uses the <code>customPrototype</code> property to determine if it needs to require a custom prototype or create a default prototype.
    @function
    @return new prototype
    */
    newInstancePrototype: {
        value: function() {
            if (this.customPrototype) {
                var results = Promise.defer();
                require.async(this.moduleId,
                    function(exports) {
                        results.resolve(exports);
                    });
                var self = this;
                return results.promise.then(function(exports) {
                        var prototype = exports[self.prototypeName];
                        return (prototype ? prototype : null)
                    }
                )
            } else {
                if (exports[self.prototypeName]) {
                    var parentInstancePrototype = (this.parent ? this.parent.newInstancePrototype() : Montage );
                    var newPrototype = Montage.create(parentInstancePrototype, {
                        // Token class
                    });
                    ObjectProperty.manager.applyWithBlueprint(newPrototype, this);
                    exports[self.prototypeName] = newPrototype;
                }
                var prototype = exports[self.prototypeName];
                return (prototype ? prototype : null)
            }
        }
    },
/**
        Description TODO
        @type {Property}
        @default {String} null
    */
    name: {
        value: null,
        serializable: true
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @returns this.initWithNameAndModuleId(name, null)
    */
    initWithName: {
        value: function(name) {
            return this.initWithNameAndModuleId(name, null);
        }
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @param {String} moduleId TODO
    @returns itself
    */
    initWithNameAndModuleId: {
        value: function(name, moduleId) {
            this.name = (name !== null ? name : "default");
            // The default is that the prototype name is the name
            this.prototypeName = this.name;
            this.moduleId = moduleId;
            this.customPrototype = false;
            return this;
        }
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    binder: {
        value: null,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    parent: {
        value: null,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    moduleId: {
        value: null,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    prototypeName: {
        value: null,
        serializable: true
    },
/**
        Defines if the blueprint should use custom prototype for new instances.<br>
        Returns <code>true</code> if the blueprint needs to require a custom prototype for creating new instances, <code>false</code> if new instance are generic prototypes.
        @type {Boolean}
        @default false
    */
    customPrototype: {
        value: false,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Array} new Array(10)
    */
    attributes: {
        value: new Array(10),
        serializable: true,
        distinct: true,
        writable: false
    },
/**
  Description TODO
  @private
*/
    _attributesTable: {
        value: {},
        serializable: false,
        distinct: true,
        enumerable: false,
        writable: false
    },
/**
        Description TODO
        @type  {Property}
        @default {Array} new Array(10)
    */
    queries: {
        value: new Array(10),
        serializable: true,
        distinct: true,
        writable: false
    },
/**
  Description TODO
  @private
*/
    _queriesTable: {
        value: {},
        serializable: false,
        distinct: true,
        enumerable: false,
        writable: false
    },
/**
        Description TODO
        @type {Property}
        @default {Table} {}
    */
    restrictionsTable: {
        value: {},
        serializable: true,
        distinct: true,
        enumerable: false,
        writable: false
    },
    /**
    Add a new attribute to this blueprint.<br>
    If that attribute was associated with another blueprint it will be removed first.
    @function
    @param {String} attribute The attribute to be added.
    @returns attribute
    */
    addAttribute: {
        value: function(attribute) {
            if (attribute !== null && attribute.name !== null) {
                var index = this.attributes.indexOf(attribute);
                if (index < 0) {
                    if (attribute.blueprint !== null) {
                        attribute.blueprint.removeAttribute(attribute);
                    }
                    this.attributes.push(attribute);
                    this._attributesTable[attribute.name] = attribute;
                    attribute.blueprint = this;
                }
            }
            return attribute;
        }
    },
/**
    Description TODO
    @function
    @param {String} attribute The attribute to be removed.
    @returns attribute
    */
    removeAttribute: {
        value: function(attribute) {
            if (attribute !== null && attribute.name !== null) {
                var index = this.attributes.indexOf(attribute);
                if (index >= 0) {
                    this.attributes.splice(index, 1);
                    delete this._attributesTable[attribute.name];
                    attribute.blueprint = null;
                }
            }
            return attribute;
        }
    },
/**
    Convenience to add one attribute.
    @function
    @param {String} name Add to one attribute
    @returns name
    */
    addToOneAttributeNamed: {
        value: function(name) {
            return this.addAttribute(this.createToOneAttribute().initWithName(name));
        }
    },

/**
    Convenience to add many attributes.
    @function
    @param {String} name Add to many attributes
    @returns names
    */
    addToManyAttributeNamed: {
        value: function(name) {
            return this.addAttribute(this.createToManyAttribute().initWithName(name));
        }
    },

    /*
     *
     */
/**
    Convenience to add an attribute to one relationship.
    @function
    @param {String} name TODO
    @param {String} inverse TODO
    @returns relationship
    */
    addToOneRelationshipNamed: {
        value: function(name, inverse) {
            var relationship = this.addAttribute(this.createToOneRelationship().initWithName(name));
            if ((inverse != null) && (typeof inverse.targetBlueprint === "object")) {
                relationship.targetBlueprint = inverse.blueprint;
                inverse.targetBlueprint = this;
            }
            return relationship;
        }
    },
/**
    Convenience to add an attribute to many relationships.
    @function
    @param {String} name TODO
    @param {String} inverse TODO
    @returns relationship
    */
    addToManyRelationshipNamed: {
        value: function(name, inverse) {
            var relationship = this.addAttribute(this.createToManyRelationship().initWithName(name));
            if ((inverse != null) && (typeof inverse.targetBlueprint === "object")) {
                relationship.targetBlueprint = inverse.blueprint;
                inverse.targetBlueprint = this;
            }
            return relationship;
        }
    },
/**
    Conventional method to create one new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} ToOneAttribute.create()
    */
    createToOneAttribute: {
        value: function() {
            return ToOneAttribute.create();
        }
    },

   /**
    Conventional method to create many new attributes.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} ToManyAttribute.create()
    */
    createToManyAttribute: {
        value: function() {
            return ToManyAttribute.create();
        }
    },

    /*
     *
     */
/**
    Conventional method to create new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} ToOneRelationship.create()
    */
    createToOneRelationship: {
        value: function() {
            return ToOneRelationship.create();
        }
    },

 /**
    Conventional method to create new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} ToOneRelationship.create()
    */
    createToManyRelationship: {
        value: function() {
            return ToManyRelationship.create();
        }
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @returns attribute
    */
    attributeForName: {
        value: function(name) {
            var attribute = this._attributesTable[name];
            if (typeof attribute === "undefined") {
                attribute = UnknownAttribute;
                var anAttribute, index;
                for (index = 0; typeof (anAttribute = this.attributes[index]) !== "undefined"; index++) {
                    if (anAttribute.name === name) {
                        attribute = anAttribute;
                        break;
                    }
                }
                this._attributesTable[name] = attribute;
            }
            if (attribute === UnknownAttribute) {
                attribute = null;
            }
            return attribute;
        }

    },
/**
    Description TODO
    @function
    @param {String} query TODO
    @returns query
    */
    addQuery: {
        value: function(query) {
            if (query !== null && query.name != null) {
                if (query.blueprint !== this) {
                    throw Exception.create().initWithMessageTargetAndMethod("Query not associated with this blueprint", this, query.name);
                }
                var index = this.queries.indexOf(query);
                if (index < 0) {
                    this.queries.push(query);
                    this._queriesTable[query.name] = query;
                }
            }
            return query;
        }
    },
/**
    Description TODO
    @function
    @param {String} query TODO
    @returns query
    */
    removeQuery: {
        value: function(query) {
            if (query !== null && query.name != null) {
                if (query.blueprint !== this) {
                    throw Exception.create().initWithMessageTargetAndMethod("Query not associated with this blueprint", this, query.name);
                }
                var index = this.queries.indexOf(query);
                if (index >= 0) {
                    this.queries.splice(index, 1);
                    delete this._queriesTable[query.name];
                }
            }
            return query;
        }
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @returns query
    */
    queryForName: {
        value: function(name) {
            var query = this._queriesTable[name];
            if (typeof query === "undefined") {
                query = UnknownQuery;
                var aQuery, index;
                for (index = 0; typeof (aQuery = this.queries[index]) !== "undefined"; index++) {
                    if (query.name === name) {
                        query = aQuery;
                        break;
                    }
                }
                this._queriesTable[name] = query;
            }
            if (query === UnknownQuery) {
                query = null;
            }
            return query;
        }
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @param {Selector} selector TODO
    @returns restriction
    */
    addRestriction: {
        value: function(name, selector) {
            var restriction = null;
            if (name != null && selector != null) {
                restriction = this.restrictionsTable[name] = selector;
            }
            return restriction;
        }
    },
/**
    Description TODO
    @function
    @param {String} name TODO
    @returns restriction
    */
    removeRestriction: {
        value: function(name) {
            if (name !== null) {
                var restriction = this.restrictionsTable[name]
                if (restriction != null) {
                    delete restriction;
                }
            }
            return restriction;
        }
    },

/**
    Return the selector for this restriction.<br>
    <b>Note:</b> This selector is usually parametric.<br>
    Parameters need to be resolved before it can be evaluated.
    @function
    @param {String} restriction TODO
    @returns selector
    */
    selectorForRestriction: {
        value: function(restriction) {
            var selector = null;
            if (restriction != null) {
                selector = this.restrictionsTable[restriction.name];
                if (typeof selector === 'undefined') {
                    selector = null;
                }
                if ((selector == null) && (this.binder !== null)) {
                    selector = this.binder.defaultSelectorForRestriction(restriction);
                }
            }
            return selector;
        }
    },

/**
    This is the get function called on the target object to access properties.<br>
    On call this refers to the target object.
    @function
    @param {Object} propertyName TODO
    @returns {Array} [storageKey]
    */
    blueprintGet: {
        value: function(propertyName) {
            var attribute = this.blueprint.attributeForName(propertyName);
            var storageKey = "_" + attribute.name;
            this.willRead(attribute);
            return this[storageKey];
        },
        enumerable: false,
        serializable: false
    },
/**
    This is the get function called on the target object to set properties.<br>
    On call this refers to the target object.
    @function
    @param {Object} propertyName TODO
    @param {Property} value TODO
    @returns {Array} [storageKey]
    */
    blueprintSet: {
        value: function(propertyName, value) {
            var attribute = this.blueprint.attributeForName(propertyName);
            var storageKey = "_" + attribute.name;
            if (value == null && attribute.denyDelete) {
                throw Exception.create().initWithMessageTargetAndMethod("Deny Delete", this, attribute.name);
            } else {
                this.willModify(attribute);
                this[storageKey] = value;
            }
        },
        enumerable: false,
        serializable: false
    },
/**
    Returns tne new value for the temporary object ID.<br>
    This can be overwritten by subclass.
    @function
    @returns TemporaryObjectId.create().init()
    */
    objectId$Implementation: {
        get: function() {
            return TemporaryObjectId.create().init();
        }
    },
/**
    Description TODO
    @function
    @returns Query.create().initWithBlueprint(this)
    */
    query: {
        value: function() {
            return Query.create().initWithBlueprint(this);
        }
    }

});
var UnknownBlueprint = Object.freeze(Blueprint.create().initWithName("Unknown"));
var UnknownQuery = Object.freeze(Query.create().initWithBlueprint(null));

/**
    @class module:montage/data/blueprint.Attribute
*/
var Attribute = Montage.create(Montage,/** @lends module:montage/data/blueprint.Attribute# */ {
/**
    Description TODO
    @function
    @param {String} name TODO
    @returns itself
    */
    initWithName: {
        value: function(name) {
            this._name = (name !== null ? name : "default");
            return this;
        }
    },
/**
  Description TODO
  @private
*/
    _name: {
        serializable: true,
        enumerable: false,
        value: null
    },
/**
    Description TODO
    @function
    @returns this._name
    */
    name: {
        get: function() {
            return this._name;
        }
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    blueprint: {
        value: null,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    mandatory: {
        value: false,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    denyDelete: {
        value: false,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    readOnly: {
        value: false,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    isToMany: {
        value: false,
        serializable: false
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    isDerived: {
        value: false,
        serializable: false
    }

});
var UnknownAttribute = Object.freeze(Attribute.create().initWithName("Unknown"));

/**
    @class module:montage/data/blueprint.ToOneAttribute
*/
var ToOneAttribute = exports.ToOneAttribute = Montage.create(Attribute,/** @lends module:montage/data/blueprint.ToOneAttribute# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "string"
    */
    valueType: {
        value: "string",
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Object} null
    */
    valueObjectPrototypeName: {
        value: null,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Object} null
    */
    valueObjectModuleId: {
        value: null,
        serializable: true
    }

});
/**
    @class module:montage/data/blueprint.ToOneRelationship
*/
var ToOneRelationship = exports.ToOneRelationship = Montage.create(ToOneAttribute,/** @lends module:montage/data/blueprint.ToOneRelationship# */ {
/**
        Description TODO
        @type {Property}
        @default {Object} null
    */
    targetBlueprint: {
        value: null,
        serializable: true
    }

});
/**
    @class module:montage/data/blueprint.ToManyAttribute
*/
var ToManyAttribute = exports.ToManyAttribute = Montage.create(Attribute,/** @lends module:montage/data/blueprint.ToManyAttribute# */ {
/**
        Description TODO
        @type {Property}
        @default null
    */
    sort: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} true
    */
    isToMany: {
        value: true,
        serializable: false
    }

});
/**
    @class module:montage/data/blueprint.ToManyRelationship
*/
var ToManyRelationship = exports.ToManyRelationship = Montage.create(ToManyAttribute,/** @lends module:montage/data/blueprint.ToManyRelationship# */ {
/**
        Description TODO
        @type {Property}
        @default {Object} null
    */
    targetBlueprint: {
        value: null,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} true
    */
    isToMany: {
        value: true,
        serializable: false
    }

});
/**
    @class module:montage/data/blueprint.DerivedAttribute
*/
var DerivedAttribute = exports.DerivedAttribute = Montage.create(Attribute,/** @lends module:montage/data/blueprint.DerivedAttribute# */ {
/**
        Description TODO
        @type {Property}
        @default {Boolean} true
    */
    isDerived: {
        value: true,
        serializable: false
    },

  /**
        Description TODO
        @type {Property}
        @default {Array} []
    */  dependencies: {
        value: [],
        serializable: true
    },
    /**
        Description TODO
        @type {Property}
        @default null
    */
    getterDefinition: {
        value: null,
        serializable: true
    },
/**
        Description TODO
        @type {Property}
        @default null
    */
    setterDefinition: {
        value: null,
        serializable: true
    }

});
