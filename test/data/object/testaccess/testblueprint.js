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
var ToOneAssociation = require("montage/data/blueprint").ToOneAssociation;
var ToManyAssociation = require("montage/data/blueprint").ToManyAssociation;
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
    createToOneAssociation: {
        value: function() {
            return TestToOneAssociation.create();
        }
    },

    /*
     * Conventional method to crete new attribute. This can be overwritten by specific stores.
     */
    createToManyAssociation: {
        value: function() {
            return TestToManyAssociation.create();
        }
    }

});

var TestToOneAttribute = exports.TestToOneAttribute = Montage.create(ToOneAttribute, {

});

var TestToOneAssociation = exports.TestToOneAssociation = Montage.create(ToOneAssociation, {

});

var TestToManyAttribute = exports.TestToManyAttribute = Montage.create(ToManyAttribute, {

});

var TestToManyAssociation = exports.TestToManyAssociation = Montage.create(ToManyAssociation, {

});
