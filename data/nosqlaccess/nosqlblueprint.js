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
	@module montage/data/nosqlaccess/nosqlblueprint
    @requires montage/core/core
    @requires montage/data/blueprint
    @requires montage/data/nosqlaccess/nosqlselectorevaluator
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var ToOneAttribute = require("data/blueprint").ToOneAttribute;
var ToManyAttribute = require("data/blueprint").ToManyAttribute;
var ToOneRelationship = require("data/blueprint").ToOneRelationship;
var ToManyRelationship = require("data/blueprint").ToManyRelationship;
var NoSqlSelectorEvaluator = require("data/nosqlaccess/nosqlselectorevaluator").NoSqlSelectorEvaluator; // registering the evaluators
var logger = require("core/logger").logger("nosqlblueprint");

/**
    @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprintBinder
    @extends module:montage/data/blueprint.BlueprintBinder
*/
var NoSqlBlueprintBinder = exports.NoSqlBlueprintBinder = Montage.create(BlueprintBinder,/** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprintBinder# */ {

/**
        The module ID of the store to use.
        @type {Property} Function
        @default {String} "montage/data/nosqlaccess/nosqlstore"
    */
    storeModuleId: {
        value: "montage/data/nosqlaccess/nosqlstore"
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "NoSqlStore"
    */
    storePrototypeName: {
        value: "NoSqlStore"
    },
/**
    Description TODO
    @function
    @returns {Function} NoSqlBlueprint.create()
    */
    createBlueprint: {
        value: function() {
            return NoSqlBlueprint.create();
        }
    }


})
/**
    @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprint
*/
var NoSqlBlueprint = exports.NoSqlBlueprint = Montage.create(Blueprint,/** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlBlueprint# */ {

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} NoSqlToOneAttribute.create()
    */
    createToOneAttribute: {
        value: function() {
            return NoSqlToOneAttribute.create();
        }
    },

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} NoSqlToManyAttribute.create()
    */
    createToManyAttribute: {
        value: function() {
            return NoSqlToManyAttribute.create();
        }
    },

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} NoSqlToOneRelationship.create()
    */
    createToOneRelationship: {
        value: function() {
            return NoSqlToOneRelationship.create();
        }
    },

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} NoSqlToManyRelationship.create()
    */
    createToManyRelationship: {
        value: function() {
            return NoSqlToManyRelationship.create();
        }
    }

});
/**
    @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneAttribute
*/
var NoSqlToOneAttribute = exports.NoSqlToOneAttribute = Montage.create(ToOneAttribute,/** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneAttribute# */ {

});
/**
    @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneRelationship
*/
var NoSqlToOneRelationship = exports.NoSqlToOneRelationship = Montage.create(ToOneRelationship,/** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToOneRelationship# */ {

});
/**
    @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyAttribute
*/
var NoSqlToManyAttribute = exports.NoSqlToManyAttribute = Montage.create(ToManyAttribute,/** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyAttribute# */ {

});
/**
    @class module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyRelationship
*/
var NoSqlToManyRelationship = exports.NoSqlToManyRelationship = Montage.create(ToManyRelationship,/** @lends module:montage/data/nosqlaccess/nosqlblueprint.NoSqlToManyRelationship# */ {

});
