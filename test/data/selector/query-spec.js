/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Query = require("montage/data/query").Query;
var Selector = require("montage/data/selector").Selector;
var StoreManager = require("montage/data/store").StoreManager;
var logger = require("montage/core/logger").logger("selector-spec");

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var Person = require("data/object/person").Person;
var Company = require("data/object/company").Company;


describe("data/selector/query-spec", function() {
    StoreManager.defaultManager = null;

    var companyBinder = BinderHelper.companyBinder();

    describe("create", function() {
        it("new query", function() {
            var personBlueprint = companyBinder.blueprintForPrototype("Person", "data/object/person");

            var query = Query.create().initWithBlueprint(personBlueprint);

            expect(query).not.toBeNull();

        });

        it("new query from blueprint", function() {
            var personBlueprint = companyBinder.blueprintForPrototype("Person", "data/object/person");

            var query = personBlueprint.query();

            expect(query).not.toBeNull();

        });

    });
});

