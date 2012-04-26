/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/mapping
 @requires montage/data/blueprint
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage/core").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var Attribute = require("data/blueprint").Attribute;
var Association = require("data/blueprint").Association;
var logger = require("montage/logger").logger("mapping");
/**
 * A mapping is an abstract class that is defined by each access store to represent the way to map an object or a property in the backing store.
 @class module:montage/data/mapping.Mapping
 @extends module:montage/core/core.Montage
 */
var Mapping = exports.Mapping = Montage.create(Montage, /** @lends module:montage/data/mapping.Mapping# */ {

    /**
     @private
     */
    _owner:{
        serializable:true,
        enumerable:false,
        value:null
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
     Initialize a newly allocated mapping.
     @function
     @param {binder} owner of this mapping
     @returns itself
     */
    initWithBinder:{
        value:function (binder) {
            this._owner = binder;
            return this;
        }
    },

    /**
     Store module Id associated with this binder mapping.
     @type {Property}
     @default {ID} montage/data/store
     */
    storeModuleId:{
        serializable:false,
        value:"data/store"
    },

    /**
     Store prototype name associated with this binder mapping.
     @type {Property}
     @default {String} "Store"
     */
    storePrototypeName:{
        serializable:false,
        value:"Store"
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
     Initialize a newly allocated mapping.
     @function
     @param {blueprint} owner of this mapping
     @returns itself
     */
    initWithBlueprint:{
        value:function (blueprint) {
            this._owner = blueprint;
            return this;
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
     Initialize a newly allocated mapping.
     @function
     @param {attribute} owner of this mapping
     @returns itself
     */
    initWithAttribute:{
        value:function (attribute) {
            this._owner = attribute;
            return this;
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
     Initialize a newly allocated mapping.
     @function
     @param {association} owner of this mapping
     @returns itself
     */
    initWithAssociation:{
        value:function (association) {
            this._owner = association;
            return this;
        }
    }

});

