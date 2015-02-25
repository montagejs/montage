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
var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("ui/condition", {src: "ui/condition/condition-test-page.html", firstDraw: false}, function (conditionTestPage) {
    describe("ui/condition-spec", function () {
        describe("condition with false condition and removal strategy hide", function () {
            it("upon initial load content should have a class of montage-invisible", function () {
                var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchHide")[0];
                expect(conditionDiv.classList.contains("montage-invisible")).toBeTruthy();
            });
            it("should remove montage-invisible class when condition becomes true", function () {
                conditionTestPage.test.hideValue = true;
                conditionTestPage.waitForDraw();

                runs(function (){
                    var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchHide")[0];
                    expect(conditionDiv.classList.contains("montage-invisible")).toBeFalsy();
                });
            });
        });

        describe("condition with false condition and removal strategy remove", function () {
            it("upon initial load its contents should be empty", function () {
                var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchRemove")[0];
                expect(conditionDiv.innerHTML).toBe("");
            });
            it("should add its contents to the DOM when condition becomes true", function () {
                conditionTestPage.test.removeValue = true;
                conditionTestPage.waitForDraw();

                runs(function (){
                    var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchRemove")[0];
                    expect(conditionDiv.innerHTML).toBe("<span>Foo</span>");
                });
            });
        });

        it("should not remove contents if the initial value of the condition is true", function () {
            var condition = conditionTestPage.test.templateObjects.conditionTrue;

            expect(condition.element.innerHTML).toBe("<span>Bar</span>");
        });
    });
});

TestPageLoader.queueTest("ui/nested-condition", {src: "ui/condition/nested-condition-test-page.html", firstDraw: false}, function (nestedConditionTestPage) {
});
