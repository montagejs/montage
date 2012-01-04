/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/**
	@module montage/data/sqlaccess/sqlblueprint
    @requires montage/core/core
    @requires montage/data/blueprint
    @requires montage/data/sqlaccess/sqlselectorevaluator
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var ToOneAttribute = require("data/blueprint").ToOneAttribute;
var ToManyAttribute = require("data/blueprint").ToManyAttribute;
var ToOneRelationship = require("data/blueprint").ToOneRelationship;
var ToManyRelationship = require("data/blueprint").ToManyRelationship;
var SqlSelectorEvaluator = require("data/sqlaccess/sqlselectorevaluator").SqlSelectorEvaluator; // registering the evaluators
var logger = require("core/logger").logger("sqlblueprint");

/**
    @class module:montage/data/sqlaccess/sqlblueprint.SqlBlueprintBinder
    @extends module:montage/data/blueprint.BlueprintBinder
*/
var SqlBlueprintBinder = exports.SqlBlueprintBinder = Montage.create(BlueprintBinder,/** @lends module:montage/data/sqlaccess/sqlblueprint.SqlBlueprintBinder# */ {

/**
        Description TODO
        @type {Property} URL
        @default {String} "montage/data/sqlaccess/sqlstore"
    */
    storeModuleId: {
        value: "data/sqlaccess/sqlstore"
    },
/**
        Description TODO
        @type {Property}
        @default {String} "SqlStore"
    */
    storePrototypeName: {
        value: "SqlStore"
    },
/**
    Description TODO
    @function
    @returns {Function} SqlBlueprint.create()
    */
    createBlueprint: {
        value: function() {
            return SqlBlueprint.create();
        }
    }


})
/**
    @class module:montage/data/sqlaccess/sqlblueprint.SqlBlueprint
*/
var SqlBlueprint = exports.SqlBlueprint = Montage.create(Blueprint,/** @lends module:montage/data/sqlaccess/sqlblueprint.SqlBlueprint# */ {

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} SqlToOneAttribute.create()
    */
    createToOneAttribute: {
        value: function() {
            return SqlToOneAttribute.create();
        }
    },

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} SqlToManyAttribute.create()
    */
    createToManyAttribute: {
        value: function() {
            return SqlToManyAttribute.create();
        }
    },

    /**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} SqlToOneRelationship.create()
    */
    createToOneRelationship: {
        value: function() {
            return SqlToOneRelationship.create();
        }
    },

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} SqlToManyRelationship.create()
    */
    createToManyRelationship: {
        value: function() {
            return SqlToManyRelationship.create();
        }
    }

});
/**
    @class module:montage/data/sqlaccess/sqlblueprint.SqlToOneAttribute
*/
var SqlToOneAttribute = exports.SqlToOneAttribute = Montage.create(ToOneAttribute,/** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToOneAttribute# */ {

});
/**
    @class module:montage/data/sqlaccess/sqlblueprint.SqlToOneRelationship
*/
var SqlToOneRelationship = exports.SqlToOneRelationship = Montage.create(ToOneRelationship,/** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToOneRelationship# */ {

});
/**
    @class module:montage/data/sqlaccess/sqlblueprint.SqlToManyAttribute
*/
var SqlToManyAttribute = exports.SqlToManyAttribute = Montage.create(ToManyAttribute,/** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToManyAttribute# */ {

});
/**
    @class module:montage/data/sqlaccess/sqlblueprint.SqlToManyRelationship
*/
var SqlToManyRelationship = exports.SqlToManyRelationship = Montage.create(ToManyRelationship, /** @lends module:montage/data/sqlaccess/sqlblueprint.SqlToManyRelationship# */{

});
