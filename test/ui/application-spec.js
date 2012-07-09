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
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("application-as-application", {src: "ui/application/as-application.html"}, function() {
    describe("ui/application-spec", function() {
        describe("Application used in application label", function() {
            it("should draw correctly", function() {
                expect(testPage.test).toBeDefined();
            });
            it("should be THE application", function() {
                expect(testPage.test.theOne).toEqual("true");
            });
        });
   });
});

var testPage = TestPageLoader.queueTest("application-as-owner", {src: "ui/application/as-owner.html"}, function() {
    describe("ui/application-spec", function() {
        describe("Application used in owner label", function() {
            it("should draw correctly", function() {
                expect(testPage.test).toBeDefined();
            });
        });
   });
});

var testPage = TestPageLoader.queueTest("application-test", {src: "ui/application-test/application-test.html"}, function() {
    var test = testPage.test;

    describe("ui/application-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("Application", function() {
            describe("delegate", function() {
                it("should have willFinishLoading method called", function() {
                    expect(test.testedComponent.application.delegate.willFinishLoadingCalled).toBeTruthy();
                });

            });
        });
    });
});

var testPage = TestPageLoader.queueTest("application-test-subtype", {src: "ui/application-test/application-test-subtype.html"}, function() {
    var test = testPage.test;

    describe("ui/application-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("Application", function() {

            describe("subtyping", function() {
                it("should use defined subtype", function() {
                    expect(test.testedComponent.application.testProperty).toBeTruthy();
                });

            });
        });
    });
});
