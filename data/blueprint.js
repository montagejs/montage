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
 @module montage/data/blueprint
 @requires montage/core/core
 @requires montage/data/store
 @requires montage/data/object-id
 @requires data/query
 @requires core/exception
 @requires data/object-property
 @requires core/promise
 @requires core/logger
 */
var Montage = require("montage").Montage;
var MappingSet = require("data/mapping").MappingSet;
var TemporaryObjectId = require("data/object-id").TemporaryObjectId;
var Query = require("data/query").Query;
var ObjectProperty = require("data/object-property").ObjectProperty;
var Promise = require("core/promise").Promise;
var Exception = require("core/exception").Exception;
var logger = require("core/logger").logger("blueprint");

/**
 @private
 */
var _binderManager = null;
/**
 @class module:montage/data/blueprint.BlueprintBinderManager
 @classdesc A blueprint binder manager is a singleton that is responsible for loading and dispaching binders and blueprints.
 @extends module:montage/core/core.Montage
 */
var BlueprintBinderManager = exports.BlueprintBinderManager = Montage.create(Montage, /** @lends module:montage/data/blueprint.BlueprintBinderManager# */ {

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
     Description TODO
     @type {Property} Function
     @default {Array} new Array(10)
     */
    blueprintBinders:{
        serializable:true,
        writable:false,
        distinct:true,
        value:new Array(10)
    },

    /**
     Add a new blueprint binder.
     @function
     @param {Property} binder TODO
     */
    addBlueprintBinder:{
        value:function (binder) {
            if (binder !== null) {
                var index = this.blueprintBinders.indexOf(binder);
                if (index >= 0) {
                    this.blueprintBinders.splice(index, 1);
                }
                this.blueprintBinders.push(binder);
            }
        }
    },

    /**
     Description TODO
     @function
     @param {Property} binder TODO
     */
    removeBlueprintBinder:{
        value:function (binder) {
            if (binder !== null) {
                var index = this.blueprintBinders.indexOf(binder);
                if (index >= 0) {
                    this.blueprintBinders.splice(index, 1);
                }
            }
        }
    },

    /**
     Search through the binders for a blueprint that extends that prototype.
     @function
     @param {Property} prototypeName TODO
     @param {Property} moduleId TODO
     @returns The requested blueprint or null if this prototype is not managed.
     */
    blueprintForPrototype: {
        value: function(prototypeName, moduleId) {
            var binder, blueprint, index;
            for (index = 0; typeof (binder = this.blueprintBinders[index]) !== "undefined"; index++) {
                blueprint = binder.blueprintForPrototype(prototypeName, moduleId);
                if (blueprint !== null) {
                    return blueprint;
                }
            }
            return null;
        }
    }

});

var BlueprintObject = exports.BlueprintObject = Montage.create(Montage, /** @lends module:montage/data/blueprint.BlueprintObject# */ {

    /**
     @private
     */
    _name:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Name of the object. The name is used to define the property on the object.
     @function
     @returns {String} this._name
     */
    name:{
        get:function () {
            return this._name;
        }
    },

    /**
     @private
     */
    _mappings:{
        serializable:true,
        enumerable:false,
        distinct:true,
        value: new Array(5)
    },

    /**
     @private
     */
    _mappingForName:{
        value:{},
        serializable:false,
        distinct:true,
        enumerable:false,
        writable:false
    },

    deserializedFromSerialization:{
        value:function () {
            var aMapping, index;
            for (index = 0; typeof (aMapping = this._mappings[index]) !== "undefined"; index++) {
                this._mappingForName[aMapping.name] = aMapping;
            }
        }
    },

    /**
     List of mappings attached to this object.
     @function
     @returns mappings
     */
    mappings:{
        get:function () {
            return this._mappings;
        }
    },

    /**
     Add a mapping to the list of mappings.
     @function
     @param {mapping} mapping to add.
     @returns mapping
     */
    addMapping:{
        value:function (mapping) {
            if (mapping !== null) {
                var index = this.mappings.indexOf(mapping);
                if (index < 0) {
                    if (mapping.owner !== this) {
                        throw new Error(
                            "Mapping already owned: " + JSON.stringify(mapping));
                    }
                    this.mappings.push(mapping);
                    //
                    this._addMappingForName(mapping);
                }
            }
            return mapping;
        }
    },

    /**
     Remove a mapping to the list of mappings.
     @function
     @param {mapping} mapping to remove.
     @returns mapping
     */
    removeMapping:{
        value:function (mapping) {
            if (mapping !== null) {
                var index = this.mappings.indexOf(mapping);
                if (index >= 0) {
                    this.mappings.splice(index, 1);
                    // Remove the cached entry
                    this._removeMappingForName(mapping);
                }
            }
            return mapping;
        }
    },

    /*
     * @private
     */
    _addMappingForName:{
        value:function (mapping) {
            this._mappingForName[mapping.name] = mapping;
            return mapping;
        }
    },

    /*
     * @private
     */
    _removeMappingForName:{
        value:function (mapping) {
            delete this._mappingForName[mapping.name];
            return mapping;
        }
    },

    /**
     Retrieve a mapping from the list of mappings.<br/>
     <b>Note:<b/> For Binder objects this function will return an array of mapping: One for each of the store used by the mapping name.
     @function
     @param {name} name of the mapping to retrieve.
     @returns mapping
     */
    mappingForName:{
        value:function (name) {
            return this._mappingForName[name];
        }
    }


});

/**
 @class module:montage/data/blueprint.BlueprintBinder
 @classdesc A blueprint binder is a collection of of blueprints for a specific access type. It also includes the connection information.
 @extends module:montage/core/core.Montage
 */
var BlueprintBinder = exports.BlueprintBinder = Montage.create(BlueprintObject, /** @lends module:montage/data/blueprint.BlueprintBinder# */ {

    /**
     Returns the blueprint binder manager.
     @type {Property}
     @returns Blueprint Binder Manager
     */
    manager:{
        get:function () {
            if (_binderManager === null) {
                _binderManager = BlueprintBinderManager.create().init();
            }
            return _binderManager;
        }
    },

    /**
     Description TODO
     @private
     */
    _blueprintForPrototypeTable:{
        value:{},
        serializable:false,
        distinct:true,
        enumerable:false,
        writable:false
    },

    /**
     Description TODO
     @type {Property}
     @default {Table} {}
     */
    restrictionsTable:{
        value:{},
        serializable:true,
        distinct:true,
        enumerable:false,
        writable:false
    },

    /**
     Description TODO
     @function
     @param {String} name TODO
     @returns itself
     */
    initWithName:{
        value:function (name) {
            this.name = (name !== null ? name : "default");
            return this;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Array} new Array(30)
     */
    blueprints:{
        serializable:true,
        distinct:true,
        writable:false,
        value:new Array(30)
    },

    /**
     Description TODO
     @function
     @param {Array} blueprint TODO
     @returns blueprint
     */
    addBlueprint:{
        value:function (blueprint) {
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
    removeBlueprint:{
        value:function (blueprint) {
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
    addBlueprintNamed:{
        value:function (name, moduleId) {
            return this.addBlueprint(Blueprint.create().initWithNameAndModuleId(name, moduleId));
        }
    },

    /**
     Description TODO
     @function
     @param {String} name  TODO
     @param {Selector} defaultSelector TODO
     @returns restriction
     */
    addRestriction:{
        value:function (name, defaultSelector) {
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
    removeRestriction:{
        value:function (name) {
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
    defaultSelectorForRestriction:{
        value:function (restriction) {
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
     Return the blueprint associated with this prototype.
     @function
     @param {String} prototypeName TODO
     @param {ID} moduleId TODO
     @returns blueprint
     */
    blueprintForPrototype:{
        value:function (prototypeName, moduleId) {
            var key = moduleId + "." + prototypeName;
            var blueprint = this._blueprintForPrototypeTable[key];
            if (typeof blueprint === "undefined") {
                var aBlueprint, index;
                for (index = 0; typeof (aBlueprint = this.blueprints[index]) !== "undefined"; index++) {
                    if ((aBlueprint.prototypeName === prototypeName) && (aBlueprint.moduleId === moduleId)) {
                        blueprint = aBlueprint;
                        break;
                    }
                }
                this._blueprintForPrototypeTable[key] = blueprint;
            }
            if (!blueprint) {
                throw new Error(
                    "No such blueprint: " + JSON.stringify(prototypeName) +
                    " in " + JSON.stringify(moduleId) + ". Consider: " +
                    JSON.stringify(Object.keys(this._blueprintForPrototypeTable))
                );
            }
            return blueprint;
        }
    },

    /**
     Create a new mapping.
     @function
     @param {store} store to create the mapping for.
     @param {name} identifier for the new mapping.
     @param {recursive} create mapping for all blueprints in this binder.
     @returns binderMapping
     */
    createMappingForStore:{
        value:function (store, name, recursive) {
            var mappingSet = this.mappingForName(name);
            if (!mappingSet) {
                mappingSet = MappingSet.create().initWithBinderAndName(this, name);
                this.addMapping(mappingSet);
                if (this._defaultMappingSetName.length == 0) {
                    this._defaultMappingSetName = mappingSet.name;
                }
            }
            var metadata = Montage.getInfoForObject(store);
            var aMapping = mappingSet.mappingForStoreId(metadata.objectName, metadata.moduleId);
            if (!aMapping) {
                aMapping = store.createBinderMapping.initWithOwnerAndParent(this, mappingSet);
                mappingSet.addMapping(aMapping);
            }
            if (recursive || (typeof recursive === "undefined")) {
                var aBlueprint, index;
                for (index = 0; typeof (aBlueprint = this.blueprints[index]) !== "undefined"; index++) {
                    aBlueprint.createMappingForStore(store, aMapping, name);
                }
            }
            return aMapping;
        }
    },

    /**
     Delete a mapping for a given store.
     @function
     @param {store} store to delete the mapping for.
     @param {name} identifier for the mapping.
     @returns binderMapping
     */
    deleteMappingForStore:{
        value:function (store, name) {
            var mappingSet = this.mappingForName(name);
            if (mappingSet) {
                var metadata = Montage.getInfoForObject(store);
                var aMapping = mappingSet.mappingForStoreId(metadata.objectName, metadata.moduleId);
                mappingSet.removeMapping(aMapping);
                var aBlueprint, index;
                for (index = 0; typeof (aBlueprint = this.blueprints[index]) !== "undefined"; index++) {
                    aBlueprint.deleteMappingForStore(store, aMapping, name);
                }
                if (mappingSet.mappings.length == 0) {
                    this.removeMapping(mappingSet);
                    if ((this._defaultMappingSetName.length > 0) && (this._defaultMappingSetName === mappingSet.name)) {
                        if (this.mappings.length > 0) {
                            this._defaultMappingSetName = this.mappings[0].name;
                        } else {
                            this._defaultMappingSetName = "";
                        }
                    }
                }
            }
        }
    },

    _defaultMappingSetName:{
        serializable:true,
        enumerable:false,
        value:""
    },

    defaultMappingSetName:{
        get:function () {
            if (this._defaultMappingSetName.length == 0) {
                if (this.mappings.length > 0) {
                    this._defaultMappingSetName = this.mappings[0].name;
                }
            }
            return this._defaultMappingSetName;
        },
        set:function (name) {
            this._defaultMappingSetName = name;
        }
    }

});

/**
 @class module:montage/data/bluprint.Blueprint
 */
var Blueprint = exports.Blueprint = Montage.create(BlueprintObject, /** @lends module:montage/data/bluprint.Blueprint# */ {

    /**
     This is the canonical way of creating managed objects prototypes.<br>
     Newly created prototype will be blessed with all the required properties to be well behaved.
     @function
     @param {Object} aPrototype TODO
     @param {String} propertyDescriptor TODO
     @returns newPrototype
     */
    create:{
        configurable:true,
        value:function (aPrototype, propertyDescriptor) {
            if ((typeof aPrototype === "undefined") || (Blueprint.isPrototypeOf(aPrototype))) {
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
    newInstance:{
        value:function () {
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
    newInstancePrototype:{
        value:function () {
            var self = this;
            if (this.customPrototype) {
                var results = Promise.defer();
                require.async(this.moduleId,
                    function (exports) {
                        results.resolve(exports);
                    });
                return results.promise.then(function (exports) {
                        var prototype = exports[self.prototypeName];
                        return (prototype ? prototype : null)
                    }
                )
            } else {
                if (typeof exports[self.prototypeName] === "undefined") {
                    var parentInstancePrototype = (this.parent ? this.parent.newInstancePrototype() : Montage );
                    var newPrototype = Montage.create(parentInstancePrototype, {
                        // Token class
                        init:{
                            value:function () {
                                return this;
                            }
                        }
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
     The identifier is the same as the name and is used to make the
     serialization of a blueprint humane.
     @type {Property}
     @default {String} this.name
     */
    identifier:{
        get:function () {
            // TODO convert UpperCase to lower-case instead of lowercase
            return this.name.toLowerCase();
        }
    },
    /**
     Description TODO
     @function
     @param {String} name TODO
     @returns this.initWithNameAndModuleId(name, null)
     */
    initWithName:{
        value:function (name) {
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
    initWithNameAndModuleId:{
        value:function (name, moduleId) {
            this._name = (name !== null ? name : "default");
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
    binder:{
        value:null,
        serializable:true
    },
    /**
     Description TODO
     @type {Property}
     @default null
     */
    parent:{
        value:null,
        serializable:true
    },
    /**
     Description TODO
     @type {Property}
     @default null
     */
    moduleId:{
        value:null,
        serializable:true
    },
    /**
     Description TODO
     @type {Property}
     @default null
     */
    prototypeName:{
        value:null,
        serializable:true
    },
    /**
     Defines if the blueprint should use custom prototype for new instances.<br>
     Returns <code>true</code> if the blueprint needs to require a custom prototype for creating new instances, <code>false</code> if new instance are generic prototypes.
     @type {Boolean}
     @default false
     */
    customPrototype:{
        value:false,
        serializable:true
    },
    /**
     Description TODO
     @type {Property}
     @default {Array} new Array(10)
     */
    attributes:{
        value:new Array(10),
        serializable:true,
        distinct:true,
        writable:false
    },
    /**
     Description TODO
     @private
     */
    _attributesTable:{
        value:{},
        serializable:false,
        distinct:true,
        enumerable:false,
        writable:false
    },
    /**
     Description TODO
     @type  {Property}
     @default {Array} new Array(10)
     */
    queries:{
        value:new Array(10),
        serializable:true,
        distinct:true,
        writable:false
    },
    /**
     Description TODO
     @private
     */
    _queriesTable:{
        value:{},
        serializable:false,
        distinct:true,
        enumerable:false,
        writable:false
    },
    /**
     Description TODO
     @type {Property}
     @default {Table} {}
     */
    restrictionsTable:{
        value:{},
        serializable:true,
        distinct:true,
        enumerable:false,
        writable:false
    },

    /**
     Add a new attribute to this blueprint.<br>
     If that attribute was associated with another blueprint it will be removed first.
     @function
     @param {String} attribute The attribute to be added.
     @returns attribute
     */
    addAttribute:{
        value:function (attribute) {
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
     Removes an attribute from teh attribute list of this blueprint.
     @function
     @param {String} attribute The attribute to be removed.
     @returns attribute
     */
    removeAttribute:{
        value:function (attribute) {
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
    addToOneAttributeNamed:{
        value:function (name) {
            return this.addAttribute(Attribute.create().initWithName(name));
        }
    },

    /**
     Convenience to add many attributes.
     @function
     @param {String} name Add to many attributes
     @returns names
     */
    addToManyAttributeNamed:{
        value:function (name) {
            return this.addAttribute(Attribute.create().initWithNameAndCardinality(name, Infinity));
        }
    },

    /**
     Convenience to add an attribute to one relationship.
     @function
     @param {String} name TODO
     @param {String} inverse TODO
     @returns relationship
     */
    addToOneAssociationNamed:{
        value:function (name, inverse) {
            var relationship = this.addAttribute(Association.create().initWithName(name));
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
    addToManyAssociationNamed:{
        value:function (name, inverse) {
            var relationship = this.addAttribute(Association.create().initWithNameAndCardinality(name, Infinity));
            if ((inverse != null) && (typeof inverse.targetBlueprint === "object")) {
                relationship.targetBlueprint = inverse.blueprint;
                inverse.targetBlueprint = this;
            }
            return relationship;
        }
    },

    /**
     Description TODO
     @function
     @param {String} name TODO
     @returns attribute
     */
    attributeForName:{
        value:function (name) {
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
     Create a new mapping.
     @function
     @param {store} store to create the mapping for.
     @param {mapping} parent mapping.
     @param {name} identifier for the new mapping.
     @returns binderMapping
     */
    createMappingForStore:{
        value:function (store, mapping, name) {
            var aMapping = this.mappingForName(name);
            if (!aMapping) {
                aMapping = store.createBlueprintMapping.initWithOwnerAndParent(this, mapping);
                this.addMapping(aMapping);
                var anAttribute, index;
                for (index = 0; typeof (anAttribute = this.attributes[index]) !== "undefined"; index++) {
                    anAttribute.createMappingForStore(store, aMapping, name);
                }
            }
            return aMapping;
        }
    },

    /**
     Delete a mapping for a given store.
     @function
     @param {store} store to delete the mapping for.
     @param {mapping} parent mapping.
     @param {name} identifier for the mapping.
     @returns binderMapping
     */
    deleteMappingForStore:{
        value:function (store, mapping, name) {
            var aMapping = this.mappingForName(name);
            if (aMapping && (aMapping.parent === mapping)) {
                this.removeMapping(aMapping);
                var anAttribute, index;
                for (index = 0; typeof (anAttribute = this.attributes[index]) !== "undefined"; index++) {
                    anAttribute.deleteMappingForStore(store, aMapping, name);
                }
            }
        }
    },

    /**
     Description TODO
     @function
     @param {String} query TODO
     @returns query
     */
    addQuery:{
        value:function (query) {
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
    removeQuery:{
        value:function (query) {
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
    queryForName:{
        value:function (name) {
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
    addRestriction:{
        value:function (name, selector) {
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
    removeRestriction:{
        value:function (name) {
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
    selectorForRestriction:{
        value:function (restriction) {
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
    blueprintGet:{
        value:function (propertyName) {
            var attribute = this.blueprint.attributeForName(propertyName);
            var storageKey = "_" + attribute.name;
            this.willRead(attribute);
            return this[storageKey];
        },
        enumerable:false,
        serializable:false
    },
    /**
     This is the get function called on the target object to set properties.<br>
     On call this refers to the target object.
     @function
     @param {Object} propertyName TODO
     @param {Property} value TODO
     @returns {Array} [storageKey]
     */
    blueprintSet:{
        value:function (propertyName, value) {
            var attribute = this.blueprint.attributeForName(propertyName);
            var storageKey = "_" + attribute.name;
            if (value == null && attribute.denyDelete) {
                throw Exception.create().initWithMessageTargetAndMethod("Deny Delete", this, attribute.name);
            } else {
                this.willModify(attribute, value);
                this[storageKey] = value;
            }
        },
        enumerable:false,
        serializable:false
    },
    /**
     Returns tne new value for the temporary object ID.<br>
     This can be overwritten by subclass.
     @function
     @returns TemporaryObjectId
     */
    objectId$Implementation:{
        get:function () {
            return TemporaryObjectId.create().initWithBlueprint(this);
        }
    },
    /**
     Description TODO
     @function
     @returns Query.create().initWithBlueprint(this)
     */
    query:{
        value:function () {
            return Query.create().initWithBlueprint(this);
        }
    }

});
var UnknownBlueprint = Object.freeze(Blueprint.create().initWithName("Unknown"));
var UnknownQuery = Object.freeze(Query.create().initWithBlueprint(null));

/**
 @class module:montage/data/blueprint.Attribute
 */
var Attribute = exports.Attribute = Montage.create(BlueprintObject, /** @lends module:montage/data/blueprint.Attribute# */ {

    /**
     Initialize a newly allocated attribute.
     @function
     @param {String} name name of the attribute to create
     @returns itself
     */
    initWithName:{
        value:function (name) {
            return this.initWithNameAndCardinality(name, 1);
        }
    },

    /**
     Initialize a newly allocated attribute.
     @function
     @param {String} name name of the attribute to create
     @param {Number} cardinality name of the attribute to create
     @returns itself
     */
    initWithNameAndCardinality:{
        value:function (name, cardinality) {
            this._name = (name !== null ? name : "default");
            this._cardinality = (cardinality > 0 ? cardinality : 1);
            return this;
        }
    },

    /**
     The identifier is the name of the blueprint, dot, the name of the
     attribute, and is used to make the serialization of attributes more
     readable.
     @type {Property}
     @default {String} this.name
     */
    identifier:{
        get:function () {
            return [
                this.blueprint.identifier,
                this.name
            ].join("_");
        }
    },

    /**
     Blueprint this attribute belongs to.
     @type {Property}
     @default null
     */
    blueprint:{
        value:null,
        serializable:true
    },

    /**
     Description TODO
     @private
     */
    _cardinality:{
        serializable:true,
        enumerable:false,
        value:1
    },

    /**
     Cardinality of the attribute.<br/>
     The Cardinality of an attribute is the number of values that can be stored. A cardinality of one means that only one object can be stored. Only positive values are legal. A value of infinity means that any number of values can be stored.
     @type {Property}
     @default {Number} 1
     */
    cardinality:{
        get:function () {
            return this._cardinality;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    mandatory:{
        value:false,
        serializable:true
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    denyDelete:{
        value:false,
        serializable:true
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    readOnly:{
        value:false,
        serializable:true
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isAssociation:{
        get:function () {
            return false;
        },
        serializable:false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isToMany:{
        get:function () {
            return this.cardinality > 1;
        },
        serializable:false
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isDerived:{
        get:function () {
            return false;
        },
        serializable:false
    },

    /**
     Description TODO
     @type {Property}
     @default {String} "string"
     */
    valueType:{
        value:"string",
        serializable:true
    },
    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    valueObjectPrototypeName:{
        value:null,
        serializable:true
    },

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    valueObjectModuleId:{
        value:null,
        serializable:true
    },

    /**
     Create a new mapping.
     @function
     @param {store} store to create the mapping for.
     @param {mapping} parent mapping.
     @param {name} identifier for the new mapping.
     @returns binderMapping
     */
    createMappingForStore:{
        value:function (store, mapping, name) {
            var aMapping = this.mappingForName(name);
            if (!aMapping) {
                aMapping = store.createAttributeMapping.initWithOwnerAndParent(this, mapping);
                this.addMapping(aMapping);
            }
            return aMapping;
        }
    },

    /**
     Delete a mapping for a given store.
     @function
     @param {store} store to delete the mapping for.
     @param {mapping} parent mapping.
     @param {name} identifier for the mapping.
     @returns binderMapping
     */
    deleteMappingForStore:{
        value:function (store, mapping, name) {
            var aMapping = this.mappingForName(name);
            if (aMapping) {
                this.removeMapping(aMapping);
            }
        }
    }

});
var UnknownAttribute = Object.freeze(Attribute.create().initWithName("Unknown"));
/**
 @class module:montage/data/blueprint.Association
 */
var Association = exports.Association = Montage.create(Attribute, /** @lends module:montage/data/blueprint.Association# */ {
    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    targetBlueprint:{
        value:null,
        serializable:true
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} false
     */
    isAssociation:{
        get:function () {
            return true;
        },
        serializable:false
    },

    /**
     Create a new mapping.
     @function
     @param {store} store to create the mapping for.
     @param {mapping} parent mapping.
     @param {name} identifier for the new mapping.
     @returns binderMapping
     */
    createMappingForStore:{
        value:function (store, mapping, name) {
            var aMapping = this.mappingForName(name);
            if (!aMapping) {
                aMapping = store.createAssociationMapping.initWithOwnerAndParent(this, mapping);
                this.addMapping(aMapping);
            }
            return aMapping;
        }
    },

    /**
     Delete a mapping for a given store.
     @function
     @param {store} store to delete the mapping for.
     @param {mapping} parent mapping.
     @param {name} identifier for the mapping.
     @returns binderMapping
     */
    deleteMappingForStore:{
        value:function (store, mapping, name) {
            var aMapping = this.mappingForName(name);
            if (aMapping) {
                this.removeMapping(aMapping);
            }
        }
    }

});

/**
 A derived is attribute is calculated using other attributes of the object.<br/>

 @class module:montage/data/blueprint.DerivedAttribute
 */
var DerivedAttribute = exports.DerivedAttribute = Montage.create(Attribute, /** @lends module:montage/data/blueprint.DerivedAttribute# */ {
    /**
     Description TODO
     @type {Property}
     @default {Boolean} true
     */
    isDerived:{
        get:function () {
            return true;
        },
        serializable:false
    },

    /**
     List of attributes this derived attribute depends on.
     @type {Property}
     @default {Array} []
     */
    dependencies:{
        value:[],
        serializable:true
    },
    /**
     Description TODO
     @type {Property}
     @default null
     */
    getterDefinition:{
        value:null,
        serializable:true
    },
    /**
     Description TODO
     @type {Property}
     @default null
     */
    setterDefinition:{
        value:null,
        serializable:true
    }

});
