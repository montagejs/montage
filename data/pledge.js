/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
 @module montage/data/pledge
 @requires montage/core/core
 @requires montage/core/promise
 @requires montage/core/logger
 */
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var logger = require("core/logger").logger("pledge");
/**
 @class module:montage/data/pledge.Pledge
 @extends module:montage/core/promise.Promise
 */
var Pledge = exports.Pledge = Montage.create(Promise, /** @lends module:montage/data/pledge.Pledge# */ {

    /**
     Description TODO
     @type {Property}
     @default {Object} null
     */
    objectId: {
        serializable: true,
        enumerable: false,
        value: null
    },

    /**
     Description TODO
     @private
     */
    _context: {
        serializable: true,
        enumerable: false,
        value: null
    },

    /**
     Description TODO
     @type {Property}
     @default {String} null
     */
    context: {
        enumerable: false,
        get: function() {
            return this._query;
        }
    },

    /**
     Stores the blueprint associated with this pledge
     @private
     */
    _blueprint: {
        serializable: true,
        enumerable: false,
        value: null
    },
    /**
     Returns the blueprint associated with this pledge
     @function
     @returns this._blueprint
     @default null
     */
    blueprint: {
        serializable: false,
        enumerable: false,
        get: function() {
            return this._blueprint;
        }
    },

    /**
     Description TODO
     @function
     @param {Instance} instance
     @returns instance.isPledge
     */
    isPledge: {
        value: function(instance) {
            if (instance === null) {
                return false;
            }
            if (typeof instance.isPledge === 'undefined') {
                return false;
            }
            return instance.isPledge;
        }
    },


    /**
     Description TODO
     @function
     @param {String} propertyPaths
     @returns this object
     */
    withProperties: {
        value: function(/* propertyPaths */) {
            var propertyPaths = Array.prototype.slice.call(arguments);
            return this;
        }
    },

    /**
     Description TODO
     @function
     @returns undefined
     */
    valueOf: {
        value: function() {
            return undefined;
        }
    }

});

/**
 @class module:montage/data/pledge.PledgedSortedSet
 @extends module:montage/data/pledge.Pledged
 */
var PledgedSortedSet = exports.PledgedSortedSet = Montage.create(Pledge, /** @lends module:montage/data/pledge.PledgedSortedSet# */ {

    /**
     Description TODO
     @private
     */
    _query: {
        serializable: true,
        enumerable: false,
        value: null
    },

    /**
     Description TODO
     @function
     @returns this._query
     @default null
     */
    query: {
        enumerable: false,
        get: function() {
            return this._query;
        }
    },

    /**
     Description TODO
     @function
     @returns this._query.blueprint
     */
    blueprint: {
        enumerable: false,
        get: function() {
            return this._query.blueprint;
        }
    },

    /**
     Description TODO
     @function
     @param {Property} query TODO
     @param {Property} context TODO
     */
    initWithQueryAndContext: {
        value: function(query, context) {
            this._query = query;
            this._context = context;
        }
    },

    /**
     Description TODO
     @type {Property}
     @default {Boolean} true
     */
    isPledge: {
        serializable: false,
        enumerable: false,
        value: true
    },

    /**
     Returns the expected number of item for this array.<br/>
     <b>Note:</b> This value is not constant as depending upon the type of backing store, the number of objects returned may vary over time.
     @function
     @returns {Number} 0 The expected number of items in the pledged array.
     */
    length: {
        value: function () {
            return 0;
        }
    },

    /**
     Checks if the pledged array is empty.<br/>
     <b>Note:</b> This value is not constant as depending upon the type of backing store, the number of objects returned may vary over time.
     @function
     @returns {Boolean} <code>true</code> if the array is empty, <code>false</code> otherwise.
     */
    empty: {
        value: function () {
            return this.length() == 0;
        }
    },

    /**
     Description TODO
     @function
     @param {Property} value TODO
     @returns false
     */
    has: {
        value: function (value) {
            return false;
        }
    },

    /**
     Description TODO
     @function
     @param {Property} value TODO
     @returns value The obtained value.
     */
    get: {
        value: function (value) {
            return value;
        }
    },

    /**
     Description TODO
     @function
     @param {Property} value TODO
     @returns value The added value.
     */
    add: {
        value: function (value) {
            return value;
        }
    },

    /**
     Description TODO
     @function
     @param {Property} value TODO
     @returns value The deleted value.
     */
    "delete": {
        value: function (value) {
            return value;
        }
    },

    /**
     Description TODO
     @function
     @param {Function} callback TODO
     @param {Property} context TODO
     */
    forEach: {
        value: function (callback, context) {
        }
    }

})
