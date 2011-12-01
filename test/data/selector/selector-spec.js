/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Selector = require("montage/data/selector").Selector;
var Q = require("montage/core/promise");
var logger = require("montage/core/logger").logger("selector-spec");


var CustomSelector = exports.CustomSelector = Montage.create(Selector, {

    /*
     * Constructor
     *  @param key path string
     *  @constructor
     */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            return this;
        }
    },


    evaluate: {
        value: function(objects, callback) {
            return null;
        }
    },

    aliases: {
        value: ["custom1", "custom2"],
        writable: false

    }

});


describe("data/selector/selector-spec", function() {
    describe("Register", function() {
        var registry = Selector.registry;

        it("create", function() {
            expect(registry).not.toBe(null);
        });

        it("custom selector", function() {
            registry.registerSelector(CustomSelector);

            expect(registry.selectorForKey("custom1")).not.toBe(null);
            expect(registry.selectorForKey("custom2")).not.toBe(null);

            registry.deregisterSelector(CustomSelector);

            expect(registry.selectorForKey("custom1")).toBe(null);
            expect(registry.selectorForKey("custom2")).toBe(null);
        });

    });

    describe("Equal", function() {

        it("String Array", function() {
            var values = ["one", "two", "three", "four"];

            var promise = values.filterWithSelector(Selector.equal("two")).then(function(result) {
                return result;
            });

            waitsFor(function() {
                return !Q.isPromise(promise.valueOf());
            }, "promise", 500);
            runs(function() {
                var result = promise.valueOf();
                expect(result.length).toBe(1);
                expect(result[0]).toBe("two");
            });
        });

    });

});
