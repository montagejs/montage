/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/data/blueprint").Blueprint;
var BlueprintBinder = require("montage/data/blueprint").BlueprintBinder;
var Attribute = require("montage/data/blueprint").Attribute;
var Association = require("montage/data/blueprint").Association;
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

});
