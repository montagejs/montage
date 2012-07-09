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
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("token-field-test", function() {
    var test = testPage.test;

    describe("ui/token-field-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("TokenField", function(){
           it("can be created", function() {
               expect(test.tokenField1).toBeDefined();
               expect(test.tokenField2).toBeDefined();
           });
           // … and more

           describe("Once loaded", function() {
               describe ("value and textValue testing", function() {

                   it("value from serialization has been set", function() {
                       expect(test.tokenField1.values).toBeNull();
                       expect(test.tokenField2.values).toBeNull();
                   });

                   it("can set a new value", function() {
                       runs(function(){
                           var values = [{
                               name: 'California',
                               code: 'CA'
                           }];
                           test.states = values;
                           testPage.waitForDraw();
                           runs(function() {
                               expect(test.tokenField1.values).toBe(values);
                           });
                       });
                   });
               });

               describe ("can pick a suggested value", function() {


                   it("can select a suggestion", function() {
                          runs(function(){
                              var autocomplete2 = test.tokenField2._autocomplete;

                              autocomplete2.element.value = 'news';
                              // simulate the 'input' event on the textfield
                              autocomplete2._setValue();
                              // this is required as needsDraw is normally not set when user enters
                              // into the input field directly
                              autocomplete2.needsDraw = true;
                              testPage.waitForDraw();

                              runs(function() {
                                  //console.log('autocomplete2.value after input event', autocomplete2.value);
                                  testPage.keyEvent({target: autocomplete2.element, keyCode: 13}, 'keyup');
                                  testPage.waitForDraw();
                                  //console.log('tokenField1 suggestedValue', test.tokenField1.suggestedValue);

                                  runs(function() {
                                      //console.log('tokenField1 value after accepting suggestion', test.tokenField1.value);
                                      expect(test.tokenField2.values[0]).toBe("news");
                                      expect(test.tags[0]).toBe("news");
                                  });

                              });

                          });
                      });

                      it("can select a suggestion without existing values (gh-572)", function() {

                        runs(function(){
                            var autocomplete2 = test.tokenField2._autocomplete;
                            var newToken = 'User Experience';

                            autocomplete2.element.value = newToken;
                            // simulate the 'input' event on the textfield
                            autocomplete2._setValue();
                            autocomplete2.needsDraw = true;

                            testPage.waitForDraw();

                            runs(function() {
                                console.log('draw after selecting a suggestion');
                                testPage.keyEvent({target: autocomplete2.element, keyCode: 13}, 'keyup');
                                testPage.waitForDraw();

                                runs(function() {
                                    console.log('tokenField2 values after accepting suggestion', test.tokenField2.values);
                                    expect(test.tokenField2.values[1]).toBe(newToken);
                                    expect(test.tags[1]).toBe(newToken);

                                });

                            });

                        });
                    });



                   it("cannot select a suggestion unless a match is found if ad-hoc values are not allowed", function() {
                       runs(function(){
                           var autocomplete1 = test.tokenField1._autocomplete;

                           autocomplete1.element.value = 'ABCD';
                           // simulate the 'input' event on the textfield
                           autocomplete1._setValue();
                           autocomplete1.needsDraw = true;

                           testPage.waitForDraw();

                           runs(function() {

                               var event = document.createEvent('CustomEvent');
                               event.initEvent('keyup', true, true);
                               event.keyCode = 13;

                               var prevValues = test.tokenField1.values;

                               autocomplete1.handleKeyup(event);
                               testPage.waitForDraw();

                               runs(function() {
                                   //console.log('tokenField1 value after accepting suggestion', test.tokenField1.value);
                                   expect(test.tokenField1.values).toBe(prevValues);
                                   expect(test.states).toBe(prevValues);
                               });

                           });

                       });
                   });

               });
           });
        });
    });
});
