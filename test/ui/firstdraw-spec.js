/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var simpleTestPage = TestPageLoader.queueTest("firstdraw-simple", {src: "ui/drawing/simple.html", firstDraw: true}, function() {
    describe("ui/firstdraw-spec", function() {
        it("should load", function() {
            expect(simpleTestPage.loaded).toBeTruthy();
        });
        describe("component", function() {
            it("should draw within first draw", function() {
                var text = simpleTestPage.iframe.contentDocument.getElementsByClassName("dynamictext")[0];
                expect(text).not.toBeNull();
                expect(text.textContent).toEqual("Test Value");
            });
        });
        describe("component with template", function() {
            it("should draw within first draw", function() {
                var button = simpleTestPage.iframe.contentDocument.getElementsByClassName("montage-button")[0];
                var text = simpleTestPage.iframe.contentDocument.getElementsByClassName("dynamictext")[1];
                expect(button).not.toBeNull();
                expect(button.textContent).toEqual("Button");
                expect(text).not.toBeNull();
                expect(text.textContent).toEqual("Custom Test Value");
            });
        });
    });
});

var repetitionTestPage = TestPageLoader.queueTest("firstdraw-repetition", {src: "ui/drawing/repetition.html", firstDraw: true}, function() {
    describe("Drawing Repetition", function() {
        it("should load", function() {
            expect(repetitionTestPage.loaded).toBeTruthy();
        });
        describe("repeating component", function() {
            it("should draw within first draw", function() {
                var text0 = repetitionTestPage.iframe.contentDocument.querySelectorAll(".list1 > div")[0];
                expect(text0).not.toBeNull();
                expect(text0.textContent).toEqual("Test Value");
            });
        });
        describe("repeating component with template", function() {
            it("should draw within first draw", function() {
                var button0 = repetitionTestPage.iframe.contentDocument.querySelectorAll(".list2 .montage-button")[0];
                var text0 = repetitionTestPage.iframe.contentDocument.querySelectorAll(".list2 .dynamictext")[0];
                expect(button0).not.toBeNull();
                expect(button0.textContent).toEqual("Button");
                expect(text0).not.toBeNull();
                expect(text0.textContent).toEqual("Custom Test Value");
            });
        });
    });
});
var cancelDrawTestPage = TestPageLoader.queueTest("firstdraw-cancel-draw", {src: "ui/drawing/cancel-draw.html", firstDraw: false}, function() {
    describe("Canceling a component draw", function() {
        it("should load", function() {
            expect(cancelDrawTestPage.loaded).toBeTruthy();
        });
        it("should not call draw on a template based component where needsDraw has been set to false", function() {
            // setup spies
            spyOn(cancelDrawTestPage.test.sliderC, 'draw').andCallThrough();
            spyOn(cancelDrawTestPage.test.customC, 'draw').andCallThrough();

            // Setup drawing
            cancelDrawTestPage.test.slotC.content = cancelDrawTestPage.test.sliderC;
            cancelDrawTestPage.test.sliderC.needsDraw = false;
            cancelDrawTestPage.test.slotC.content = cancelDrawTestPage.test.customC;

            cancelDrawTestPage.waitForDraw(2);

            runs(function() {
                expect(cancelDrawTestPage.test.sliderC.needsDraw).toBeFalsy();
                expect(cancelDrawTestPage.test.customC.needsDraw).toBeFalsy();
                expect(cancelDrawTestPage.test.sliderC.draw).not.toHaveBeenCalled();
                expect(cancelDrawTestPage.test.customC.draw).toHaveBeenCalled();
            });
        });
    });
});
