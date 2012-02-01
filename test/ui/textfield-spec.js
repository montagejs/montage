/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
    var isString = function(object) {
        return _toString.call(object) === STRING_CLASS;
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
