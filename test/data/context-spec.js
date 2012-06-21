/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/data/blueprint").Blueprint;
var BlueprintBinder = require("montage/data/blueprint").BlueprintBinder;
var ChangeContext = require("montage/data/change-context").ChangeContext;
var Store = require("montage/data/store").Store;
var StoreManager = require("montage/data/store").StoreManager;
var TransactionId = require("montage/data/transaction-id").TransactionId;
var logger = require("montage/core/logger").logger("context-spec");

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var Person = require("data/object/person").Person;
var Company = require("data/object/company").Company;

describe("data/context-spec", function () {
    StoreManager.defaultManager = null;

    var companyBinder = BinderHelper.companyBinder();
    companyBinder.createMappingForStore(Store.create().init(), "StoreMapping", true);
    var personBlueprint = companyBinder.blueprintForPrototype("Person", "data/object/person");

    describe("creation", function () {
        var context = ChangeContext.create().init();

        it("successful", function () {
            expect(context).not.toBe(null);
        });
    });

    describe("insert object", function () {
        var context = ChangeContext.create().init();

        var louis = null;
        it("should be inserted in the context, have an Id and be registered", function () {
            var transactionId = TransactionId.manager.startTransaction("StoreMapping");
            var promise = context.requireStoreForBlueprint(personBlueprint, transactionId).then(function (store) {
                louis = Person.create();
                return context.insert(louis);
            });
            waitsFor(function () {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function () {
                TransactionId.manager.closeTransaction(transactionId);
                var result = promise.valueOf();
                expect(result).not.toBeNull();
                expect(result.context).toBe(context);
                expect(result.objectId).not.toBeNull();
                expect(context.objectForId(louis.objectId)).toBe(result);
            });
        });
    });

    describe("delete object", function () {
        var context = ChangeContext.create().init();

        var louis = null;
        it("should be deleted by the context, and should not be associated with a context", function () {
            var transactionId = TransactionId.manager.startTransaction("StoreMapping");
            var promise = context.requireStoreForBlueprint(personBlueprint, transactionId).then(function (store) {
                louis = Person.create();
                return context.insert(louis)
                    .then(function (insertedObject) {
                        return context.delete(insertedObject)
                            .then(function (deletedObject) {
                                return deletedObject;
                            });
                    })
            });
            waitsFor(function () {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function () {
                TransactionId.manager.closeTransaction(transactionId);
                var result = promise.valueOf();
                expect(result).not.toBeNull();
                expect(context.objectForId(result.objectId)).toBeNull();
                expect(result.context).toBeNull();
            });
        });

    });

});
