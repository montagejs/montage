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
	@module montage/data/restaccess/restblueprint
    @requires montage/core/core
    @requires montage/data/blueprint
    @requires montage/data/restaccess/restselectorevaluator
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var Blueprint = require("data/blueprint").Blueprint;
var BlueprintBinder = require("data/blueprint").BlueprintBinder;
var ToOneAttribute = require("data/blueprint").ToOneAttribute;
var ToManyAttribute = require("data/blueprint").ToManyAttribute;
var ToOneRelationship = require("data/blueprint").ToOneRelationship;
var ToManyRelationship = require("data/blueprint").ToManyRelationship;
var RestSelectorEvaluator = require("data/restaccess/restselectorevaluator").RestSelectorEvaluator; // registering the evaluators
var logger = require("core/logger").logger("restblueprint");

/**
    @class module:montage/data/restaccess/restblueprint.RestBlueprintBinder
    @extends module:montage/data/blueprint.BlueprintBinder
*/
var RestBlueprintBinder = exports.SqlBlueprintBinder = Montage.create(BlueprintBinder,/** @lends module:montage/data/restaccess/restblueprint.RestBlueprintBinder# */ {

/**
        Description TODO
        @type {Property} URL
        @default {String} "montage/data/restaccess/reststore"
    */
    storeModuleId: {
        value: "montage/data/restaccess/reststore"
    },

/**
        Description TODO
        @type {Property} Function
        @default {String} "RestStore"
    */
    storePrototypeName: {
        value: "RestStore"
    },

/**
    Description TODO
    @function
    @returns {Function} RestBlueprint.create()
    */
    createBlueprint: {
        value: function() {
            return RestBlueprint.create();
        }
    }


})

/**
    @class module:montage/data/restaccess/restblueprint.RestBlueprint
*/
var RestBlueprint = exports.RestBlueprint = Montage.create(Blueprint,/** @lends module:montage/data/restaccess/restblueprint.RestBlueprint# */ {

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} RestToOneAttribute.create()
    */
    createToOneAttribute: {
        value: function() {
            return RestToOneAttribute.create();
        }
    },

    /**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} RestToManyAttribute.create()
    */
    createToManyAttribute: {
        value: function() {
            return RestToManyAttribute.create();
        }
    },

    /**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} RestToOneRelationship.create()
    */
    createToOneRelationship: {
        value: function() {
            return RestToOneRelationship.create();
        }
    },

/**
    Conventional method to crete new attribute.<br>
    This can be overwritten by specific stores.
    @function
    @returns {Function} RestToManyRelationship.create()
    */
    createToManyRelationship: {
        value: function() {
            return RestToManyRelationship.create();
        }
    }

});
/**
    @class module:montage/data/restaccess/restblueprint.RestToOneAttribute
*/
var RestToOneAttribute = exports.RestToOneAttribute = Montage.create(ToOneAttribute,/** @lends module:montage/data/restaccess/restblueprint.RestToOneAttribute# */ {

});
/**
    @class module:montage/data/restaccess/restblueprint.RestToOneRelationship
*/
var RestToOneRelationship = exports.RestToOneRelationship = Montage.create(ToOneRelationship,/** @lends module:montage/data/restaccess/restblueprint.RestToOneRelationship# */ {

});
/**
    @class module:montage/data/restaccess/restblueprint.RestToManyAttribute
*/
var RestToManyAttribute = exports.RestToManyAttribute = Montage.create(ToManyAttribute,/** @lends module:montage/data/restaccess/restblueprint.RestToManyAttribute# */ {

});
/**
    @class module:montage/data/restaccess/restblueprint.RestToManyRelationship
*/
var RestToManyRelationship = exports.RestToManyRelationship = Montage.create(ToManyRelationship,/** @lends module:montage/data/restaccess/restblueprint.RestToManyRelationship# */ {

});
