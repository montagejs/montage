/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
        TestPageLoader = require("support/testpageloader").TestPageLoader;

var changeSelection = function(select, selectedIndex) {
    select.options[selectedIndex].selected = true;
    var evt = document.createEvent('Event');
    evt.initEvent('change', true, true);
    select.dispatchEvent(evt);
};

var testPage = TestPageLoader.queueTest("select-input-test", function() {

    var test = testPage.test;


    describe("ui/select-input-spec", function() {
        describe("initialization", function() {
            it("should load", function() {
                expect(testPage.loaded).toBeTruthy();
            });

            describe("once loaded", function() {

                describe("Tests for Department select-input", function() {
                    it("dept's contentController is created", function() {
                        expect(test.dept.contentController).not.toBeNull();
                    });
                    it("dept should have values from content", function() {
                        console.log('contentController: ',  test.dept);
                        expect(test.dept.contentController.content.length).toBe(6);
                    });


                });

                describe("Tests for Country select-input", function() {
                    it("country's contentController is created", function() {
                        expect(test.country.contentController).not.toBeNull();
                    });

                    it("country should get its possible values from the markup", function() {
                        expect(test.country.contentController.organizedObjects.length).toBe(5);
                    });

                    // select a country via the contentController
                    it("country can be set via its contentController", function() {
                        var controller = test.country.contentController;
                        controller.selectedIndexes = [2];
                        testPage.waitForDraw();
                        runs(function(){
                            console.log('selectedOptions: ' + test.country.element.selectedIndex);
                            expect(test.country.element.selectedIndex).toBe(2);
                        });
                    });

                    it("country's contentController must reflect selections", function() {
                        var select = test.country.element;
                        changeSelection(select, 1);

                        testPage.waitForDraw();
                        runs(function(){
                            console.log('country contentController after change: ', test.country.contentController);
                            expect(test.country.contentController.selectedIndexes[0]).toBe(1);
                        });
                    });
                });

                describe("Tests for State select-input", function() {
                    it("state's contentController is created", function() {
                        expect(test.state.contentController).not.toBeNull();
                    });

                    it("state should contain values for US when US is selected as the Country", function() {
                        // since US is selectedCountry by default
                        var controller = test.country.contentController;
                        controller.selectedIndexes = [1];  // US
                        testPage.waitForDraw();
                        runs(function(){
                            //console.log('selectedOptions: ' + test.country.element.selectedIndex);
                            expect(test.state.contentController.organizedObjects.length).toBe(7);
                        });


                    });
                });


                // test set/get of standard and global attributes
                describe("when setting standard attributes", function() {



                });

                // TODO
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
