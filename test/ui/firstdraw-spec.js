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

TestPageLoader.queueTest("firstdraw-simple", {src: "ui/drawing/simple.html", firstDraw: true}, function (simpleTestPage) {
    describe("ui/firstdraw-spec", function () {
        describe("component", function () {
            it("should draw within first draw", function () {
                var text = simpleTestPage.iframe.contentDocument.getElementsByClassName("dynamictext")[0];
                expect(text).not.toBeNull();
                expect(text.textContent).toEqual("Test Value");
            });
        });
        describe("component with template", function () {
            it("should draw within first draw", function () {
                var text = simpleTestPage.iframe.contentDocument.getElementsByClassName("dynamictext")[1];
                expect(text).not.toBeNull();
                expect(text.textContent).toEqual("Custom Test Value");
            });
        });
        it("should insert styles from component template with no templateElement", function () {
            var onlyStyle = simpleTestPage.iframe.contentDocument.getElementsByClassName("onlyStyle")[0];

            expect(getComputedStyle(onlyStyle).paddingTop).toBe("42px");
        });
    });
});

TestPageLoader.queueTest("firstdraw-repetition", {src: "ui/drawing/repetition.html", firstDraw: true}, function (repetitionTestPage) {
    describe("Drawing Repetition", function () {
        describe("repeating component", function () {
            it("TODO should draw within first draw", function () {

                repetitionTestPage.waitForComponentDraw(repetitionTestPage.test.repetition1);

                runs(function () {
                    var text0 = repetitionTestPage.iframe.contentDocument.querySelectorAll(".list1 > div")[0];
                    expect(text0).not.toBeFalsy();
                    expect(text0.textContent).toEqual("Test Value");
                });
            });
        });
        describe("repeating component with template", function () {
            it("should draw within first draw", function () {
                var text0 = repetitionTestPage.iframe.contentDocument.querySelectorAll(".list2 .dynamictext")[0];
                expect(text0).not.toBeFalsy();
                expect(text0.textContent).toEqual("Custom Test Value");
            });
        });
    });
});
//var cancelDrawTestPage = TestPageLoader.queueTest("firstdraw-cancel-draw", {src: "ui/drawing/cancel-draw.html", firstDraw: false}, function () {
//    describe("Canceling a component draw", function () {
//        it("should load", function () {
//            expect(cancelDrawTestPage.loaded).toBeTruthy();
//        });
//        it("should not call draw on a template based component where needsDraw has been set to false", function () {
//            // setup spies
//            spyOn(cancelDrawTestPage.test.sliderC, 'draw').andCallThrough();
//            spyOn(cancelDrawTestPage.test.customC, 'draw').andCallThrough();
//
//            // Setup drawing
//            cancelDrawTestPage.test.slotC.content = cancelDrawTestPage.test.sliderC;
//            cancelDrawTestPage.test.sliderC.needsDraw = false;
//            cancelDrawTestPage.test.slotC.content = cancelDrawTestPage.test.customC;
//
//            cancelDrawTestPage.waitForDraw(2);
//
//            runs(function () {
//                expect(cancelDrawTestPage.test.sliderC.needsDraw).toBeFalsy();
//                expect(cancelDrawTestPage.test.customC.needsDraw).toBeFalsy();
//                expect(cancelDrawTestPage.test.sliderC.draw).not.toHaveBeenCalled();
//                expect(cancelDrawTestPage.test.customC.draw).toHaveBeenCalled();
//            });
//        });
//    });
//});
//var templateParametersTestPage = TestPageLoader.queueTest("firstdraw-template-parameters", {src: "ui/drawing/template-parameters.html", firstDraw: true}, function () {
//    describe("Template parameters draw", function () {
//        it("should load", function () {
//            expect(templateParametersTestPage.loaded).toBeTruthy();
//        });
//
//        it("should replace the template parameters with the component dom arguments", function () {
//            var decorator = templateParametersTestPage.test.decorator,
//                element = decorator.element;
//
//            expect(element.children.length).toBe(1);
//            expect(element.children[0].children.length).toBe(2);
//        });
//
//        it("should pass the component arguments to another component arguments using template parameters", function () {
//            var compositionDecorator = templateParametersTestPage.test.compositionDecorator,
//                element = compositionDecorator.element,
//                decoration;
//
//            decoration = element.querySelector(".decoration");
//            expect(decoration.children.length).toBe(2);
//        });
//
//        it("should pass the component arguments to another component arguments along with other elements using template parameters", function () {
//            var compositionDecoratorMore = templateParametersTestPage.test.compositionDecoratorMore,
//                element = compositionDecoratorMore.element,
//                decoration;
//
//            decoration = element.querySelector(".decoration");
//            expect(decoration.children.length).toBe(2);
//        });
//
//        it("should replace the template named parameters with the component dom arguments", function () {
//            var parameters = templateParametersTestPage.test.parameters,
//                element = parameters.element,
//                item1 = element.querySelector(".item1 > span"),
//                item2 = element.querySelector(".item2 > span");
//
//            expect(item1.textContent).toBe("One");
//            expect(item2.textContent).toBe("Two");
//        });
//    });
//});
//
