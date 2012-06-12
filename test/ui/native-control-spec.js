/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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


