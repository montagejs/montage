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
var Montage = require("montage").Montage,
TestPageLoader = require("support/testpageloader").TestPageLoader;



var testPage = TestPageLoader.queueTest("native-control-test", function() {
    var test = testPage.test;

    describe("native-control-spec", function() {

        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("input text", function() {
            it("can be created", function(){
                var txt1 = test.txt1;
                expect(txt1).not.toBeFalsy();
            });
            it("prototype has the properties for its attributes ", function(){
                var txt1 = test.txt1;
                expect(txt1.accept).not.toBeUndefined();
                expect(txt1.checked).not.toBeUndefined();
            });

            it("has property descriptors for its attributes ", function(){
                var txt1 = test.txt1;
                expect(txt1._getElementAttributeDescriptor('accept')).not.toBeFalsy();
                expect(txt1._getElementAttributeDescriptor('readonly')).not.toBeFalsy();
            });

            it("does not contain property descriptors for invalid attributes even if value is set in the markup ", function(){
                var txt3 = test.txt3;
                expect(txt3._getElementAttributeDescriptor('min')).toBeFalsy();
                expect(txt3._getElementAttributeDescriptor('max')).toBeFalsy();
            });

            it("only valid attributes can be set on a NativeControl", function() {
                var txt3 = test.txt3;
                expect(txt3.max).toBeUndefined();
            });

            it("only valid attributes are rendered in the DOM ", function() {
                var instance = test.txt2;
                instance.min = '20'; // invalid attribute 'min'

                expect(instance.element.getAttribute('min')).toBeFalsy();
            });

            it("can change value of a valid attribute ", function() {
                var instance = test.txt3;
                instance.value = 'hello';
                testPage.waitForDraw();
                runs(function() {
                    expect(instance.element.value).toBe("hello");
                });

            });

        });


        describe("textarea and textContent", function() {
            it("can read textcontent as value", function() {
                var instance = test.textarea1;
                expect(instance.value).toBe("hello world");
            });
            it("can change value of a textcontent ", function() {
                var instance = test.textarea1;
                instance.value = 'hola';
                testPage.waitForDraw();
                runs(function() {
                    expect(instance.element.value).toBe("hola");
                });

            });
        });
    });

});


