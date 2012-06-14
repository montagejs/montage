/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var conditionTestPage = TestPageLoader.queueTest("ui/condition", {src: "ui/condition/condition-test-page.html", firstDraw: false}, function() {
    describe("ui/condition-spec", function() {
        it("should load", function() {
            expect(conditionTestPage.loaded).toBeTruthy();
        });

        describe("condition with false condition and removal strategy hide", function() {
            it("upon initial load content should have a class of montage-invisible", function() {
                var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchHide")[0];
                expect(conditionDiv.classList.contains("montage-invisible")).toBeTruthy();
            });
            it("should remove montage-invisible class when condition becomes true", function() {
                conditionTestPage.test.hideValue = true;
                conditionTestPage.waitForDraw();

                runs(function(){
                    var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchHide")[0];
                    expect(conditionDiv.classList.contains("montage-invisible")).toBeFalsy();
                });
            });
        });

        describe("condition with false condition and removal strategy remove", function() {
            it("upon initial load its contents should be empty", function() {
                var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchRemove")[0];
                expect(conditionDiv.innerHTML).toBe("");
            });
            it("should add its contents to the DOM when condition becomes true", function() {
                conditionTestPage.test.removeValue = true;
                conditionTestPage.waitForDraw();

                runs(function(){
                    var conditionDiv = conditionTestPage.iframe.contentDocument.getElementsByClassName("fetchRemove")[0];
                    expect(conditionDiv.innerHTML).toBe("<span>Foo</span>");
                });
            });
        });
    });
});

var nestedConditionTestPage = TestPageLoader.queueTest("ui/nested-condition", {src: "ui/condition/nested-condition-test-page.html", firstDraw: false}, function() {
    describe("ui/nested-condition-spec", function() {
        it("should load", function() {
            expect(nestedConditionTestPage.loaded).toBeTruthy();
        });
    });
});
