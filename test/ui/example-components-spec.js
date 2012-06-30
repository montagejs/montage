/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global expect */
var Montage = require("montage").Montage,
        TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("example-components", function() {
    var queryMontage = function(id) {
        return testPage.querySelector("*[data-montage-id='" + id + "']");
    }
    var queryComponent = function(id) {
        var element = queryMontage(id);

        if (element) {
            return element.controller;
        }
    };

    describe("ui/example-components-spec", function() {
        describe("TimeSince", function() {
            it("should", function() {
                testPage.waitForDraw();
                runs(function() {
                    waits(1000);
                    runs(function() {
                        var timeSince = queryComponent("time-since");
                        expect(timeSince).toBeDefined();

                        var text = timeSince.element.textContent;
                        var match = /(\d+) (seconds?)/.exec(text);
                        expect(match).toBeDefined();

                        var delta = Number(match[1]);
                        expect(isNaN(delta)).toBeFalsy();
                        if (delta === 1) {
                            expect(match[2]).toBe("second");
                        } else {
                            expect(match[2]).toBe("seconds");
                        }
                    });
                });
            });
        });
    });
});
