/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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
