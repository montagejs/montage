/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("list-test", function() {
    describe("ui/list-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
        });

        var list;

        beforeEach(function() {
            list = testPage.test.list;
        });

        describe("when first loaded", function() {
            it("it should have no initial content", function() {
                expect(list._repetition).toBeDefined();
                expect(list._repetition._items.length).toBe(3);
                expect(list._element.querySelectorAll(".montage-slider").length).toBe(3);
            });
        });
    });
});
