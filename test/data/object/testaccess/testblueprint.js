/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/data/blueprint").Blueprint;
var BlueprintBinder = require("montage/data/blueprint").BlueprintBinder;
var ToOneAttribute = require("montage/data/blueprint").ToOneAttribute;
var ToManyAttribute = require("montage/data/blueprint").ToManyAttribute;
var ToOneRelationship = require("montage/data/blueprint").ToOneRelationship;
var ToManyRelationship = require("montage/data/blueprint").ToManyRelationship;
var TestSelectorEvaluator = require("data/object/testaccess/testselectorevaluator").TestSelectorEvaluator; // registering the evaluators
var logger = require("montage/core/logger").logger("testblueprint");


var TestBlueprintBinder = exports.SqlBlueprintBinder = Montage.create(BlueprintBinder, {


    storeModuleId: {
        value: "data/object/testaccess/teststore"
    },

    storePrototypeName: {
        value: "TestStore"
    },

    createBlueprint: {
        value: function() {
            return TestBlueprint.create();
        }
    }


})

var TestBlueprint = exports.TestBlueprint = Montage.create(Blueprint, {

    /*
     * Conventional method to crete new attribute. This can be overwritten by specific stores.
     */
    createToOneAttribute: {
        value: function() {
            return TestToOneAttribute.create();
        }
    },

    /*
     * Conventional method to crete new attribute. This can be overwritten by specific stores.
     */
    createToManyAttribute: {
        value: function() {
            return TestToManyAttribute.create();
        }
    },

    /*
     * Conventional method to crete new attribute. This can be overwritten by specific stores.
     */
    createToOneRelationship: {
        value: function() {
            return TestToOneRelationship.create();
        }
    },

    /*
     * Conventional method to crete new attribute. This can be overwritten by specific stores.
     */
    createToManyRelationship: {
        value: function() {
            return TestToManyRelationship.create();
        }
    }

});

var TestToOneAttribute = exports.TestToOneAttribute = Montage.create(ToOneAttribute, {

});

var TestToOneRelationship = exports.TestToOneRelationship = Montage.create(ToOneRelationship, {

});

var TestToManyAttribute = exports.TestToManyAttribute = Montage.create(ToManyAttribute, {

});

var TestToManyRelationship = exports.TestToManyRelationship = Montage.create(ToManyRelationship, {

});
