/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
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
