/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    EventInfo = require("support/testpageloader").EventInfo;

var testPage = TestPageLoader.queueTest("autocomplete-test", function() {
    var test = testPage.test;

    describe("ui/autocomplete-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("AutocompleteTest", function(){
            it("can be created", function() {
                expect(test.autocomplete1).toBeDefined();
                expect(test.autocomplete2).toBeDefined();
            });

            describe("Once loaded", function() {
                describe ("value and textValue testing", function() {
                    it("original content has been injected", function() {
                        expect(test.autocomplete1.value).toBe("hello1,");
                    });

                    it("value from serialization has been set", function() {
                        expect(test.autocomplete2.value).toBe("Montage Rocks!,");
                    });

                    it("can set a new value", function() {
                        runs(function(){
                            var text = "Do you speak HTML?";
                            test.autocomplete1.value = text;
                            testPage.waitForDraw();
                            runs(function() {
                                expect(test.autocomplete1.value).toBe(text + ",");
                                expect(test.selectedValue1).toBe(text + ",");
                            });

                        });
                    });
                });

                describe ("suggestions popup tests", function() {
                    it("can show suggestions", function() {
                        runs(function(){
                            test.autocomplete1.element.value = 'Cal';
                            // simulate the 'input' event on the textfield
                            test.autocomplete1._setValue();

                            waits(1000);
                            runs(function() {
                                //console.log('test.autocomplete1', test.autocomplete1);
                                expect(test.autocomplete1.suggestions.count()).toBe(1);
                                expect(test.autocomplete1.showPopup).toBe(true);
                            });

                        });
                    });

                    it("does not show popup if no matches found", function() {
                        runs(function(){
                            test.autocomplete1.element.value = 'ABCD';
                            // simulate the 'input' event on the textfield
                            test.autocomplete1._setValue();

                            waits(1000);
                            runs(function() {
                                //console.log('test.autocomplete1', test.autocomplete1);
                                expect(test.autocomplete1.suggestions.count()).toBe(0);
                                expect(test.autocomplete1.showPopup).toBe(false);
                            });

                        });
                    });

                    it("can select a suggestion", function() {
                        runs(function(){
                            test.autocomplete1.element.value = 'Cal';
                            // simulate the 'input' event on the textfield
                            test.autocomplete1._setValue();

                            waits(1000);

                            runs(function() {
                                expect(test.autocomplete1.suggestions.count()).toBe(1);
                                expect(test.autocomplete1.showPopup).toBe(true);

                                var event = document.createEvent('CustomEvent');
                                event.initEvent('keyup', true, true);
                                event.keyCode = 13;

                                test.autocomplete1.handleKeyup(event);
                                testPage.waitForDraw();
                                //console.log('autocomplete1 suggestedValue', test.autocomplete1.suggestedValue);

                                runs(function() {
                                    //console.log('autocomplete1 value after accepting suggestion', test.autocomplete1.value);
                                    expect(test.autocomplete1.value).toBe("California,");
                                    expect(test.selectedValue1).toBe("California,");
                                });

                            });

                        });
                    });

                });

                it("can select a suggestion and bind the selected value", function() {
                    runs(function(){
                        test.autocomplete1.element.value = 'Cal';
                        // simulate the 'input' event on the textfield
                        test.autocomplete1._setValue();

                        waits(1000);

                        runs(function() {
                            var event = document.createEvent('CustomEvent');
                            event.initEvent('keyup', true, true);
                            event.keyCode = 13;

                            test.autocomplete1.handleKeyup(event);
                            testPage.waitForDraw();

                            runs(function() {
                                expect(test.selectedValue1).toBe("California,");
                            });

                        });

                    });
                });

                describe ("read only testing", function() {
                    it("set the autocomplete read only", function() {
                        test.autocomplete1.readOnly = true;
                        waits(150);
                        runs(function() {
                            expect(test.autocomplete1.readOnly).toBeTruthy();
                        });
                    });

                    it("set the autocomplete writable", function() {
                        test.autocomplete1.readOnly = false;
                        waits(150);
                        runs(function() {
                            expect(test.autocomplete1.readOnly).toBeFalsy();
                        });
                    });

                });
            });
        });
    });
});
