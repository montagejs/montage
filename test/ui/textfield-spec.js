/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
        TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("textfieldtest", function() {
    describe("ui/textfield-spec", function() {
        describe("initialization", function() {
            it("should load", function() {
                expect(testPage.loaded).toBeTruthy();
            });

            describe("once loaded", function() {

                it("should have no value by default", function() {
                    expect(testPage.test.textfield1.value).toBeNull();
                });

                describe("when setting the value", function() {

                    it("should accept the value when set programmatically", function() {
                        var field = testPage.test.textfield1,
                        value = 10;
                        field.value = value;

                        expect(field.value).toBe(value);
                    });

                });

                if (window.Touch) {

                    describe("when supporting touch events", function() {



                    });

                } else {

                    describe("when supporting mouse events", function() {


                    });

                }

            });
        });
    });
});
