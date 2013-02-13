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
 @module montage/data/mapping
 @requires montage/data/blueprint
 @requires montage/data/store-connection-information
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var Attribute = require("data/blueprint").Attribute;
var Association = require("data/blueprint").Association;
var StoreConnectionInformation = require("data/store-connection-information").StoreConnectionInformation;
var logger = require("core/logger").logger("mapping");
/**
 * A mapping is an abstract class that is defined by each access store to represent the way to map an object or a property in the backing store.
 @class module:montage/data/mapping.Mapping
 @extends module:montage/core/core.Montage
 */
var Mapping = exports.Mapping = Montage.create(Montage, /** @lends module:montage/data/mapping.Mapping# */ {

    /**
     * @private
     */
    _owner:{
        serializable:true,
        enumerable:false,
        value:null
    },


    /**
     * The owner is the blueprint object (binder, blueprint attribute or association) that is supported by this mapping
     */
    owner:{
        get:function () {
            return this._owner;
        }
    },

    /**
     * @private
     */
    _parent:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     * The parent is the mapping object that contains this mapping
     */
    parent:{
        get:function () {
            return this._parent;
        }
    },

    /**
     Name of the mapping. The name is used to identify a mapping.
     @function
     @returns {String} this.parent.name
     */
    name:{
        get:function () {
            return this.parent.name;
        }
    },


    /**
     Store module Id associated with this binder mapping.
     @type {Property}
     @default {ID} montage/data/store
     */
    storeModuleId:{
        get:function () {
            return this.parent.storeModuleId;
        }
    },

    /**
     Store prototype name associated with this binder mapping.
     @type {Property}
     @default {String} "Store"
     */
    storePrototypeName:{
        get:function () {
            return this.parent.storePrototypeName;
        }
    },


    /**
     Initialize a newly allocated mapping.
     @function
     @param {owner} owner of this mapping
     @param {parent} container of this mapping
     @returns itself
     */
    initWithOwnerAndParent:{
        value:function (owner, parent) {
            this._owner = owner;
            this._parent = parent;
            return this;
        }
    }

});

/**
 * A mapping set is a group of binder mappings that all relate to the same binder.<br/>
 * Together they provide exactly one mapping for each blueprint, attribute and association described in the binder.<br/>
 *
 * @class module:montage/data/mapping.MappingSet
 * @extends module:montage/data/mapping.Mapping
 */
var MappingSet = exports.MappingSet = Montage.create(Mapping, /** @lends module:montage/data/mapping.MappingSet# */ {

    /**
     @private
     */
    _name:{
        serializable:true,
        enumerable:false,
        value:null
    },

    /**
     Name of the mapping. The name is used to identify a mapping.
     @function
     @returns {String} this._name
     */
    name:{
        get:function () {
            return this._name;
        }
    },

    /**
     Binder that owns this mapping.
     @type {Property}
     @default {ID} montage/data/blueprint.BlueprintBinder
     */
    binder:{
        get:function () {
            return this._owner;
        }
    },

    /**
     Initialize a newly allocated mapping.
     @function
     @param {binder} owner of this mapping
     @param {name} name of this mapping. The name should be unique for a binder.
     @returns itself
     */
    initWithBinderAndName:{
        value:function (binder, name) {
            var newMapping = this.initWithOwnerAndParent(binder, null);
            newMapping._name = name;
            return newMapping;
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
                this.name,
                this.owner.name
            ].join("_");
        }
    },

    /**
     @private
     */
    _mappings:{
        serializable:true,
        enumerable:false,
        distinct:true,
        value:new Array(5)
    },

    /**
     @private
     */
    _mappingForStoreId:{
        value:new Object(),
        serializable:false,
        distinct:true,
        enumerable:false,
        writable:false
    },

    deserializedFromSerialization:{
        value:function () {
            var aMapping, index;
            for (index = 0; typeof (aMapping = this._mappings[index]) !== "undefined"; index++) {
                var key = [
                    aMapping.storePrototypeName,
                    aMapping.storeModuleId
                ].join("_");
                this._mappingForStoreId[key] = aMapping;
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
                    if (mapping.parent !== this) {
                        throw new Error(
                            "Mapping already owned: " + mapping.storeModuleId + "/" + mapping.storePrototypeName + " parent: " + JSON.stringify(mapping.parent.name));
                    }
                    this.mappings.push(mapping);
                    //
                    var key = [
                        mapping.storePrototypeName,
                        mapping.storeModuleId
                    ].join("_");
                    this._mappingForStoreId[key] = mapping;
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
                    var key = [
                        mapping.storePrototypeName,
                        mapping.storeModuleId
                    ].join("_");
                    delete this._mappingForStoreId[key];
                }
            }
            return mapping;
        }
    },

    /*
     * @private
     */
    _storeKeyForStore:{
        value:function (store) {
            var metadata = Montage.getInfoForObject(store);
            return [
                metadata.objectName,
                metadata.moduleId
            ].join("_");
        }
    },

    /**
     Retrieve a mapping from the list of mappings.<br/>
     @function
     @param {storePrototypeName} name of the store to retrieve.
     @param {storeModuleId} module Id of the store to retrieve.
     @returns mapping
     */
    mappingForStoreId:{
        value:function (storePrototypeName, storeModuleId) {
            var key = [
                storePrototypeName,
                storeModuleId
            ].join("_");
            return this._mappingForStoreId[key];
        }
    }

});

/**
 * A binder mapping is an abstract class that is defined by each access store to represent the way to way to access a the backing store.
 @class module:montage/data/mapping.BinderMapping
 @extends module:montage/data/mapping.Mapping
 */
var BinderMapping = exports.BinderMapping = Montage.create(Mapping, /** @lends module:montage/data/mapping.BinderMapping# */ {

    /**
     Binder that owns this mapping.
     @type {Property}
     @default {ID} montage/data/blueprint.BlueprintBinder
     */
    binder:{
        get:function () {
            return this._owner;
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
                this.parent.identifier,
                this.storeModuleId,
                this.storePrototypeName,
                this.owner.name
            ].join("_");
        }
    },

    /**
     Store module Id associated with this binder mapping.
     @type {Property}
     @default {ID} montage/data/store
     */
    storeModuleId:{
        get:function () {
            return "data/store";
        }
    },

    /**
     Store prototype name associated with this binder mapping.
     @type {Property}
     @default {String} "Store"
     */
    storePrototypeName:{
        get:function () {
            return "Store";
        }
    },


    /**
     @private
     */
    _connectionInformations:{
        serializable:true,
        enumerable:false,
        value:{}
    },


    /**
     List of connection information attached to this binder mapping.
     @function
     @returns mappings
     */
    connectionInformations:{
        get:function () {
            return this._connectionInformations;
        }
    },


    /**
     @private
     */
    _connectionInfoForName:{
        value:{},
        serializable:false,
        distinct:true,
        enumerable:false,
        writable:false
    },

    deserializedFromSerialization:{
        value:function () {
            var anInfo, index;
            for (index = 0; typeof (anInfo = this.connectionInformations[index]) !== "undefined"; index++) {
                this._connectionInfoForName[anInfo.name] = anInfo;
            }
        }
    },

    /*
     * Create a new connection information object. This can be overwritten by subclass if necessary.
     * @function
     * @returns connection information
     */
    createConnectionInformation:{
        value:function () {
            return StoreConnectionInformation.create();
        }
    },

    /**
     Add a connection information to the list of connection information.
     @function
     @param {info} connection information to add.
     @returns info
     */
    addConnectionInformation:{
        value:function (info) {
            if (info !== null) {
                var index = this.connectionInformations.indexOf(info);
                if (index < 0) {
                    this.connectionInformations.push(info);
                    // Add the cache
                    this._connectionInfoForName[info.name] = info;
                    // Fix the default
                    if (this._defaultConnectionInformationName.length == 0) {
                        this._defaultConnectionInformationName = info.name;
                    }
                }
            }
            return info;
        }
    },

    /**
     Remove a connection information to the list of connection information.
     @function
     @param {info} connection information to remove.
     @returns info
     */
    removeConnectionInformation:{
        value:function (info) {
            if (info !== null) {
                var index = this.connectionInformations.indexOf(info);
                if (index >= 0) {
                    this.connectionInformations.splice(index, 1);
                    // Remove the cached entry
                    delete this._connectionInfoForName[info.name];
                    // Fix the default
                    if ((this._defaultConnectionInformationName.length > 0) && (this._defaultConnectionInformationName === info.name)) {
                        if (this.connectionInformations.length > 0) {
                            this._defaultConnectionInformationName = this.connectionInformations[0].name;
                        } else {
                            this._defaultConnectionInformationName = "";
                        }
                    }
                }
            }
            return info;
        }
    },

    /**
     Retrieve a connection information object from the list of connection information.<br/>
     @function
     @param {name} name of the connection information to retrieve.
     @returns connection information
     */
    connectionInformationForName:{
        value:function (name) {
            return this._connectionInfoForName[name];
        }
    },


    _defaultConnectionInformationName:{
        serializable:true,
        enumerable:false,
        value:""
    },

    defaultConnectionInformationName:{
        get:function () {
            if (this._defaultConnectionInformationName.length == 0) {
                if (this.connectionInformations.length > 0) {
                    this._defaultConnectionInformationName = this.connectionInformations[0].name;
                }
            }
            return this._defaultConnectionInformationName;
        },
        set:function (name) {
            this._defaultConnectionInformationName = name;
        }
    },

    defaultConnectionInformation:{
        get:function () {
            return this.connectionInformationForName(this.defaultConnectionInformationName);
        }
    }


});


/**
 * A blueprint mapping is an abstract class that is defined by each access store to represent the way to way to access a the backing store.
 @class module:montage/data/mapping.BlueprintMapping
 @extends module:montage/data/mapping.Mapping
 */
var BlueprintMapping = exports.BlueprintMapping = Montage.create(Mapping, /** @lends module:montage/data/mapping.BlueprintMapping# */ {

    /**
     Blueprint that owns this mapping.
     @type {Property}
     @default {ID} montage/data/blueprint.Blueprint
     */
    blueprint:{
        get:function () {
            return this._owner;
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
                this.parent.identifier,
                this.owner.name
            ].join("_");
        }
    }

});


/**
 * An attribute mapping is an abstract class that is defined by each access store to represent the way to way to access a the backing store.
 @class module:montage/data/mapping.AttributeMapping
 @extends module:montage/data/mapping.Mapping
 */
var AttributeMapping = exports.AttributeMapping = Montage.create(Mapping, /** @lends module:montage/data/mapping.AttributeMapping# */ {

    /**
     Attribute that owns this mapping.
     @type {Property}
     @default {ID} montage/data/blueprint.Attribute
     */
    attribute:{
        get:function () {
            return this._owner;
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
                this.parent.identifier,
                this.owner.name
            ].join("_");
        }
    }

});


/**
 * An association mapping is an abstract class that is defined by each access store to represent the way to way to access a the backing store.
 @class module:montage/data/mapping.AssociationMapping
 @extends module:montage/data/mapping.Mapping
 */
var AssociationMapping = exports.AssociationMapping = Montage.create(Mapping, /** @lends module:montage/data/mapping.AssociationMapping# */ {

    /**
     Association that owns this mapping.
     @type {Property}
     @default {ID} montage/data/blueprint.Association
     */
    association:{
        get:function () {
            return this._owner;
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
                this.parent.identifier,
                this.owner.name
            ].join("_");
        }
    }

});

