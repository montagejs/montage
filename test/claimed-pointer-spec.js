/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("claimed-pointer-test", function() {
    describe("claimed-pointer-spec", function() {
        var componentA,
            componentB,
            eventManager;

        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        beforeEach(function() {
            var testDocument = testPage.iframe.contentDocument;
            eventManager = testDocument.application.eventManager;
            eventManager.reset();

            componentA = testPage.test.componentA;
            componentB = testPage.test.componentB;
        });

        describe("an unclaimed pointer identifier", function() {

            it("should be successfully claimed by a component", function() {
                eventManager.claimPointer("touch1", componentA);

                expect(eventManager._claimedPointers["touch1"]).toBe(componentA);
            });

        });

        describe("a claimed pointer identifier", function() {

            beforeEach(function() {
                eventManager.claimPointer("touch1", componentA);
            });

            it("should be successfully forfeited by the owner component", function() {
                eventManager.forfeitPointer("touch1", componentA);

                expect(eventManager._claimedPointers["touch1"]).toBeUndefined();
            });

            it("must not be forfeited from a component it is not claimed by", function() {
                expect(function() {
                    eventManager.forfeitPointer("touch1", componentB);
                }).toThrow("Not allowed to forfeit pointer 'touch1' claimed by another component");

                expect(eventManager._claimedPointers["touch1"]).toBe(componentA);
            });
        })

    });
});
