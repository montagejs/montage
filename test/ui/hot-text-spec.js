/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("hot-text-test", function() {
    var test = testPage.test;

    describe("ui/hot-text-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("hot-text", function() {
            it("can be created", function() {
                expect(test.number).toBeDefined();
            });

            it("increases when dragged right", function() {
                var oldValue = test.number.value;
                testPage.dragElementOffsetTo(test.number.element, 0, 300, null, function() {
                    expect(test.number.value).toBe(oldValue + 300);
                }, null);
            });
            it("decreases when dragged left", function() {

            });
            it("increases when dragged up", function() {

            });
            it("decreases when dragged down", function() {

            });
            it("it doesn't decrease when dragging up and left", function() {

            });
            it("increases when scrolled up", function() {

            });
            it("decreases when scrolled down", function() {

            });

            it("increases by more when shift is held", function() {

            });
        });
    });
});