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
var Component = require("montage/ui/component").Component;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("claimed-pointer-test/claimed-pointer-test", function (testPage) {
    var test;
    beforeEach(function () {
        test = testPage.test;
    });

    describe("claimed-pointer-spec", function () {
        var componentA,
            componentB,
            eventManager;

        beforeEach(function () {
            var testWindow = testPage.iframe.contentWindow;
            eventManager = testWindow.mr("montage/core/application").application.eventManager;
            eventManager.reset();

            componentA = testPage.test.componentA;
            componentB = testPage.test.componentB;
        });

        describe("an unclaimed pointer identifier", function () {

            it("should be successfully claimed by a component", function () {
                eventManager.claimPointer("touch1", componentA);

                expect(eventManager._claimedPointers["touch1"]).toBe(componentA);
            });

        });

        describe("a claimed pointer identifier", function () {

            beforeEach(function () {
                eventManager.claimPointer("touch1", componentA);
            });

            it("should be successfully forfeited by the owner component", function () {
                eventManager.forfeitPointer("touch1", componentA);

                expect(eventManager._claimedPointers["touch1"]).toBeUndefined();
            });

            it("must not be forfeited from a component it is not claimed by", function () {
                expect(function () {
                    eventManager.forfeitPointer("touch1", componentB);
                }).toThrow("Not allowed to forfeit pointer 'touch1' claimed by another component");

                expect(eventManager._claimedPointers["touch1"]).toBe(componentA);
            });
        })

    });
});
