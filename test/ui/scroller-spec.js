/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect,runs */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("scroller-test", function() {
    var test = testPage.test;

    describe("ui/scroller-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("Scroller", function(){
            it("can be created", function() {
                expect(test.scroller1).toBeDefined();
            });

            it("can be scrolled", function() {
                testPage.dragElementOffsetTo(test.scroller1.element, 0, -20, null, null, function() {
                    testPage.waitForDraw();
                    runs(function() {
                        expect(test.scroller1.scrollY).toBe(20);
                        expect(testPage.getElementById("list").parentNode.style.webkitTransform).toMatch("translate3d\\(0(px)?, -20px, 0(px)?\\)");
                    });

                });
            });

            describe("adding content", function() {
                var delegateSpy = {
                    didSetMaxScroll: function(event) {
                        return 1+1;
                    }
                };
                var delegate = spyOn(delegateSpy, 'didSetMaxScroll');

                test.scroller1.delegate = delegateSpy;

                var originalMaxY = test.scroller1._maxTranslateY;
                for (var i = 0; i < 5; i++) {
                    var li = document.createElement("li");
                    li.textContent = "new item " + i;
                    testPage.getElementById("list").appendChild(li);
                }

                it("calls didSetMaxScroll delegate", function() {
                    expect(delegate).toHaveBeenCalled();
                });

                it("can have the content expand", function() {
                    expect(test.scroller1._maxTranslateY).toBeGreaterThan(originalMaxY);
                });
            });
        });
    });
});