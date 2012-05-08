/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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

                              waits(1000);

                              runs(function() {

                                  var event = document.createEvent('CustomEvent');
                                  event.initEvent('keyup', true, true);
                                  event.keyCode = 13;

                                  autocomplete2.handleKeyup(event);
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


                   it("cannot select a suggestion unless a match is found if ad-hoc values are not allowed", function() {
                       runs(function(){
                           var autocomplete1 = test.tokenField1._autocomplete;

                           autocomplete1.element.value = 'ABCD';
                           // simulate the 'input' event on the textfield
                           autocomplete1._setValue();

                           waits(1000);

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
