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


var testPage = TestPageLoader.queueTest("textfieldtest", function() {

    var test = testPage.test;

    var DATE_CLASS = '[object Date]';
    var FUNCTION_CLASS = '[object Function]',
        BOOLEAN_CLASS = '[object Boolean]',
        NUMBER_CLASS = '[object Number]',
        STRING_CLASS = '[object String]',
        ARRAY_CLASS = '[object Array]',
        DATE_CLASS = '[object Date]';
    var _toString = Object.prototype.toString;

    // TODO much like Array.isArray these should probably be moved into a shim i.e. Foo.isFoo(obj)

    var isDate = function(object) {
        return _toString.call(object) === DATE_CLASS;
    };
    var isNumber = function(object) {
        return _toString.call(object) === NUMBER_CLASS;
    };


    describe("ui/textfield-spec", function() {
        describe("initialization", function() {
            it("should load", function() {
                expect(testPage.loaded).toBeTruthy();
            });

            describe("once loaded", function() {

                it("txt1 should have no value by default", function() {
                    expect(testPage.test.txt1.value).toBeNull();
                });
                it("txt1 should be required", function() {
                    expect(testPage.test.txt1.required).toBe(true);
                });
                it("txt2 should have default value", function() {
                    expect(testPage.test.txt2.value).toBe('Foo');
                });
                it("txt2 should be disabled", function() {
                    expect(testPage.test.txt2.disabled).toBe(true);
                });

                it("txt2 should not have the min/max/step element attributes", function() {
                    // these attributes are defined at the InputNumber/RangeInput
                    var instance = testPage.test.txt2;

                    expect(instance._getElementAttributeDescriptor('min')).toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('max')).toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('step')).toBe(undefined);


                });

                it("only valid attributes can be set on a NativeControl", function() {
                    var instance = testPage.test.txt2;
                    instance.min = '20'; // invalid attribute 'min'

                    expect(instance.element.getAttribute('min')).toBeFalsy();

                });

                it("txt2 should have the element attributes defined by TextInput and NativeControl", function() {
                    // these attributes are defined at the InputNumber/RangeInput
                    var instance = testPage.test.txt2;

                    expect(instance._getElementAttributeDescriptor('name')).not.toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('placeholder')).not.toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('pattern')).not.toBe(undefined);

                    expect(instance._getElementAttributeDescriptor('contenteditable')).not.toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('title')).not.toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('style')).not.toBe(undefined);
                    expect(instance._getElementAttributeDescriptor('class')).not.toBe(undefined);


                });

                describe("when setting the value", function() {

                    it("should accept the value when set programmatically", function() {
                        var field = testPage.test.txt1,
                        value = 10;
                        field.value = value;

                        expect(field.value).toBe(value);
                    });

                    it("should mark empty value as invalid for required fields", function() {
                        var field = testPage.test.txt1,
                        value = "";
                        field.value = value;

                        expect(field.element.checkValidity()).toBe(false);
                    });

                    it("should accept the value even if disabled", function() {
                        var field = testPage.test.txt2,
                        value = 10;
                        field.value = value;

                        expect(field.value).toBe(value);
                    });


                    describe("when using converter for the value", function() {
                        // date field
                        it("should a valid value", function() {
                            var field = testPage.test.date1,
                            value = "01-01-2010";
                            field.value = value;

                            expect(isDate(field.value)).toBe(true);
                            expect(field.error).toBeFalsy();
                        });
                        it("should reject an invalid value", function() {
                            var field = testPage.test.date1,
                            value = "01/01/2010";
                            field.value = value;

                            expect(field.error).not.toBeNull();
                        });

                    });

                });

                describe("when setting disabled and readonly flags", function() {
                    it("should accept boolean values for disabled", function() {
                        var field = testPage.test.txt2;
                        field.disabled = true;
                        expect(field.disabled).toBe(true);
                    });
                    it("should accept truthy values for disabled", function() {
                        var field = testPage.test.txt2;
                        field.disabled = "true";
                        expect(field.disabled).toBe(true);
                    });
                    it("should accept boolean values for disabled 2", function() {
                        var field = testPage.test.txt2;
                        field.disabled = "disabled";
                        expect(field.disabled).toBe(true);
                    });
                    it("should accept falsy values for disabled", function() {
                        var field = testPage.test.txt2;
                        field.disabled = false;
                        expect(field.disabled).toBe(false);
                    });
                    it("should accept falsy values for disabled 2", function() {
                        var field = testPage.test.txt2;
                        field.disabled = null;
                        expect(field.disabled).toBe(false);
                    });

                    // readonly
                    it("should accept boolean values for readonly", function() {
                        var field = testPage.test.txt2;
                        field.readonly = true;
                        expect(field.readonly).toBe(true);
                    });
                    it("should accept truthy values for readonly", function() {
                        var field = testPage.test.txt2;
                        field.readonly = "true";
                        expect(field.readonly).toBe(true);
                    });
                    it("should accept boolean values for readonly 2", function() {
                        var field = testPage.test.txt2;
                        field.readonly = "readonly";
                        expect(field.readonly).toBe(true);
                    });
                    it("should accept falsy values for readonly", function() {
                        var field = testPage.test.txt2;
                        field.readonly = false;
                        expect(field.readonly).toBe(false);
                    });
                    it("should accept falsy values for readonly 2", function() {
                        var field = testPage.test.txt2;
                        field.readonly = null;
                        expect(field.readonly).toBe(false);
                    });
                });

                // test set/get of standard and global attributes
                describe("when setting standard attributes", function() {
                    it("should use values from binding if provided", function() {
                        var field = testPage.test.txt3;

                        expect(field.width).toBe("200");
                        expect(field.height).toBe("200");
                    });

                    it("should accept values from markup if provided", function() {
                        var field = testPage.test.txt3;

                        expect(field.src).toBe("src");
                        expect(field.multiple).toBe(true);
                        expect(field.list).toBe("list1");

                    });
                });

                describe("when using Converter", function() {
                    // gh-970
                    it("should set the existing value even if Converter throws an error", function() {
                        var field = testPage.test.txt4;

                        expect(field.value).toBe("hello");
                        expect(field.error).toBe(null);

                        field.value = 'hello world';
                        testPage.waitForDraw();

                        runs(function() {
                           expect(field.value).toBe('hello world');
                           expect(field.error).not.toBe(null);
                        });

                    });
                    it("should set the existing value even if Converter throws an error (with _setValue)", function() {
                        var field = testPage.test.txt4;
                        field.element.value = 'hello world again';
                        field._setValue();

                        testPage.waitForDraw();

                        runs(function() {
                           expect(field.value).toBe('hello world again');
                           expect(field.error).not.toBe(null);
                        });

                    });
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
