/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/data/blueprint").Blueprint;
var BlueprintBinder = require("montage/data/blueprint").BlueprintBinder;
var SqlBlueprintBinder = require("montage/data/sqlaccess/sqlblueprint").SqlBlueprintBinder;
var Store = require("montage/data/store").Store;
var StoreManager = require("montage/data/store").StoreManager;

var Serializer = require("montage/core/serializer").Serializer;
var Deserializer = require("montage/core/deserializer").Deserializer;

var Promise = require("montage/core/promise").Promise;
var logger = require("montage/core/logger").logger("store-spec");

describe("data/store-spec", function() {
describe("Store Manager", function() {

    describe("creation", function() {
        StoreManager.defaultManager = null;
        var store1 = Store.create().init();
        var store1meta = Montage.getInfoForObject(store1);
        var store2 = Store.create().init();
        var store3 = Store.create().initWithParent(StoreManager.create().init());
        it("the default manager should be unique", function() {
            expect(store1.parent).toBe(store2.parent);
        });
        it("it should be inserted in the default manager", function() {
            expect(store1.parent.stores.indexOf(store1)).toBe(0);
            expect(store1.parent.stores.indexOf(store2)).toBe(1);
        });
        it("it can be in an independent manager", function() {
            expect(store1.parent).not.toBe(store3.parent);
            expect(store3.parent.stores.indexOf(store3)).toBe(0);
        });
    });

});

describe("Store", function() {
    StoreManager.defaultManager = null;
    var companyBinder = BlueprintBinder.create().initWithName("CompanyBinder");
    var personBlueprint = companyBinder.addBlueprintNamed("Person", "data/object/person");
    personBlueprint.addToOneAttributeNamed("name");
    personBlueprint.addToManyAttributeNamed("phoneNumbers");

    var companyBlueprint = companyBinder.addBlueprintNamed("Company", "data/object/company");
    companyBlueprint.addToOneAttributeNamed("name");

    companyBlueprint.addToManyAssociationNamed("employees", personBlueprint.addToOneAssociationNamed("employer"));

    var projectBlueprint = companyBinder.addBlueprintNamed("Project", "data/object/project");
    projectBlueprint.addToOneAttributeNamed("name");
    projectBlueprint.addToOneAttributeNamed("startDate");
    projectBlueprint.addToOneAttributeNamed("endDate");

    companyBlueprint.addToManyAssociationNamed("projects", personBlueprint.addToOneAssociationNamed("company"));

    personBlueprint.addToManyAssociationNamed("projects", projectBlueprint.addToManyAssociationNamed("employees"));

    describe("creation", function() {
        var promise = StoreManager.create().init().findStoreForBlueprintBinder(companyBinder);

        it("should be created for the blueprint", function() {
            waitsFor(function() {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });
    });

});

describe("SQLStore", function() {
    StoreManager.defaultManager = null;
    var companyBinder = SqlBlueprintBinder.create().initWithName("CompanyBinder");
    var personBlueprint = companyBinder.addBlueprintNamed("Person", "data/object/person");
    personBlueprint.addToOneAttributeNamed("name");
    personBlueprint.addToManyAttributeNamed("phoneNumbers");

    var companyBlueprint = companyBinder.addBlueprintNamed("Company", "data/object/company");
    companyBlueprint.addToOneAttributeNamed("name");

    companyBlueprint.addToManyAssociationNamed("employees", personBlueprint.addToOneAssociationNamed("employer"));

    var projectBlueprint = companyBinder.addBlueprintNamed("Project", "data/object/project");
    projectBlueprint.addToOneAttributeNamed("name");
    projectBlueprint.addToOneAttributeNamed("startDate");
    projectBlueprint.addToOneAttributeNamed("endDate");

    companyBlueprint.addToManyAssociationNamed("projects", personBlueprint.addToOneAssociationNamed("company"));

    personBlueprint.addToManyAssociationNamed("projects", projectBlueprint.addToManyAssociationNamed("employees"));

    describe("creation", function() {
        var promise = StoreManager.create().init().findStoreForBlueprintBinder(companyBinder);


        it("should be created for the SQL blueprint", function() {
            waitsFor(function() {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBe(null);
                var metadata = Montage.getInfoForObject(result);

                expect(metadata.objectName).toBe("SqlStore");
                expect(metadata.moduleId).toBe("data/sqlaccess/sqlstore");
            });
        });
    });

});
});

