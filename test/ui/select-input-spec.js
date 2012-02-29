/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
        TestPageLoader = require("support/testpageloader").TestPageLoader;

var changeSelection = function(select, selectedIndex) {
    select.options[selectedIndex].selected = true;
    var event = document.createEvent('CustomEvent');
    event.initEvent('change', true, true);
    select.dispatchEvent(event);
};

var testPage = TestPageLoader.queueTest("select-input-test", function() {

    var test = testPage.test;


    describe("ui/select-input-spec", function() {
        describe("initialization", function() {
            it("should load", function() {
                expect(testPage.loaded).toBeTruthy();
            });

            describe("once loaded", function() {

                it("select should have the Select element attributes", function() {
                    // these attributes are defined at the NumberInput/RangeInput
                    var instance = test.dept;

                    expect(instance._getElementAttributeDescriptor('multiple')).not.toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('name')).not.toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('size')).not.toBe(undefined);

                });

                it("select should have the element attributes defined by NativeControl", function() {
                    // these attributes are defined at the NumberInput/RangeInput
                    var instance = testPage.test.dept;

                    expect(instance._getElementAttributeDescriptor('placeholder')).toBe(undefined);;
                    expect(instance._getElementAttributeDescriptor('pattern')).toBe(undefined);;

                    expect(instance._getElementAttributeDescriptor('contenteditable')).not.toBe(undefined);;
                    expect(instance._getElementAttributeDescriptor('title')).not.toBe(undefined);;
                    expect(instance._getElementAttributeDescriptor('style')).not.toBe(undefined);;
                    expect(instance._getElementAttributeDescriptor('class')).not.toBe(undefined);;


                });

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

                        //testPage.waitForDraw();
                        //runs(function(){
                            console.log('country contentController after change: ', test.country.contentController);
                            expect(test.country.contentController.selectedIndexes[0]).toBe(1);
                        //});
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
                
                describe("Test that if no option is marked as selected, we set the first one as selected (gh-122)", function() {
                    var selectInput = test.noDefaultSelection;
                    expect(selectInput.contentController.selectedIndexes.length).toBe(1);
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
