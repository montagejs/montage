/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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
