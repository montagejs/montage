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
var Store = require("montage/data/store").Store;
var StoreManager = require("montage/data/store").StoreManager;
var TransactionId = require("montage/data/transaction-id").TransactionId;

var Serializer = require("montage/core/serializer").Serializer;
var Deserializer = require("montage/core/deserializer").Deserializer;

var Promise = require("montage/core/promise").Promise;
var logger = require("montage/core/logger").logger("store-spec");

var BinderHelper = require("data/object/binderhelper").BinderHelper;
var Person = require("data/object/person").Person;
var Company = require("data/object/company").Company;

describe("data/store-spec", function () {
    describe("Store Manager", function () {

        describe("creation", function () {
            StoreManager.defaultManager = null;
            var store1 = Store.create().init();
            var store1meta = Montage.getInfoForObject(store1);
            var store2 = Store.create().init();
            var store3 = Store.create().initWithParent(StoreManager.create().init());
            it("the default manager should be unique", function () {
                expect(store1.parent).toBe(store2.parent);
            });
            it("it should be inserted in the default manager", function () {
                expect(store1.parent.stores.indexOf(store1)).toBe(0);
                expect(store1.parent.stores.indexOf(store2)).toBe(1);
            });
            it("it can be in an independent manager", function () {
                expect(store1.parent).not.toBe(store3.parent);
                expect(store3.parent.stores.indexOf(store3)).toBe(0);
            });
        });

    });

    describe("Store", function () {
        var companyBinder = BinderHelper.companyBinder();
        companyBinder.createMappingForStore(Store.create().init(), "StoreMapping", true);
        var personBlueprint = companyBinder.blueprintForPrototype("Person", "data/object/person");
        StoreManager.defaultManager = null;

        it("should be created for the blueprint", function () {
            var transactionId = TransactionId.manager.startTransaction("StoreMapping");
            var promise = StoreManager.create().init().findStoreForBlueprint(personBlueprint, transactionId);
            waitsFor(function () {
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function () {
                TransactionId.manager.closeTransaction(transactionId);
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

    });

});

