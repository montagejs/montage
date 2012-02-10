/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("range-input-test", function() {
    var test = testPage.test;

    describe("ui/range-input-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("RangeInput", function() {
            it("can be created", function() {
                expect(test.range_input1).toBeDefined();
            });

            it("can be changed", function() {
                console.log(test.range_input1);
                expect(test.range_input1.value).toBe("0");

                var eventInfo = {
                    target: test.range_input1.element,
                    clientX: test.range_input1.element.offsetLeft + 30,
                    clientY: test.range_input1.element.offsetTop + 5
                };

                testPage.clickOrTouch(eventInfo);

                expect(test.range_input1.value).toBeGreaterThan(0);
            });
        });
    });
});