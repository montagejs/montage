/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */
/**
 @module montage/data/query
 @requires montage/core/core
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var logger = require("core/logger").logger("query");
/**
 @class module:montage/data/query.Query
 */
var Query = exports.Query = Montage.create(Montage, /** @lends module:montage/data/query.Query# */ {
    /**
     Description TODO
     @type {Property}
     @default {Function} null
     */
    blueprint: {
        value: null,
        serializable: true
    },

    /**
     Description TODO
     @type {Property}
     @default {Selector} null
     */
    selector: {
        value: null,
        serializable: true
    },

    /**
     Description TODO
     @type {Property}
     @default {String} ""
     */
    name: {
        serializable: true,
        enumerable: true,
        value: ""
    },

    /**
     Description TODO
     @function
     @param {Function} blueprint TODO
     @returns this.initWithBlueprintAndSelector(blueprint, null)
     */
    initWithBlueprint: {
        enumerable: true,
        value: function(blueprint) {
            return this.initWithBlueprintAndSelector(blueprint, null);
        }
    },
    /**
     Description TODO
     @function
     @param {Function} blueprint TODO
     @param {Selector} selector TODO
     @returns itself
     */
    initWithBlueprintAndSelector: {
        enumerable: true,
        value: function(blueprint, selector) {
            this.blueprint = blueprint;
            Object.defineProperty(this, "blueprint", {writable: false});
            if ((selector != null) && (typeof selector === 'object')) {
                this.selector = selector;
            } else {
                this.selector = this;
            }
            return this;
        }
    },
    /**
     Description TODO
     @function
     @param {Function} propertyPath TODO
     @returns this.selector
     */
    where: {
        value: function(propertyPath) {
            return this.selector.and.property(propertyPath)
        }
    },
    /**
     Description TODO
     @function
     @param {Function} propertyPath TODO
     @returns this.selector
     */
    property: {
        value: function(propertyPath) {
            return this.selector.and.property(propertyPath)
        }
    }

});
