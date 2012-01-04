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
var Selector = require("montage/data/selector").Selector;
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
                return promise.isFulfilled();
            }, "promise", 500);
            runs(function() {
                var result = promise.valueOf();
                expect(result.length).toBe(1);
                expect(result[0]).toBe("two");
            });
        });

    });

});
