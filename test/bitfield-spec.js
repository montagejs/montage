/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    BitField = require("montage/core/bitfield").BitField;

describe("bitfield-spec",
function() {
    describe("creating empty bitfield",
    function() {
        var bitField = BitField.create();
        it("should be true",
        function() {
            expect(bitField.value).toBeTruthy();
        });
    });
    describe("creation with four false fields",
    function() {
        var bitField;

        beforeEach(function() {
            bitField = BitField.create().initWithDescriptor({
                A: {
                    value: false
                },
                B: {
                    value: false
                },
                C: {
                    value: false
                },
                D: {
                    value: false
                }
            });
        });

        it("should have the expected field count",
        function() {
            expect(bitField._fieldCount).toEqual(4);
        });

        describe("set one of its fields to true",
        function() {
            beforeEach(function() {
                bitField.B = true;
            });
            afterEach(function() {
                bitField.B = false;
            });
            it("should be false",
            function() {
                expect(bitField.value).toBeFalsy();
            });
        });

        describe("set all of its fields to true",
        function() {
            beforeEach(function() {
                bitField.A = true;
                bitField.B = true;
                bitField.C = true;
                bitField.D = true;
            });
            it("should be true",
            function() {
                expect(bitField.value).toBeTruthy();
            });
            describe("add a false field",
            function() {
                beforeEach(function() {
                    bitField.addField("E");
                });
                it("should be false",
                function() {
                    expect(bitField.value).toBeFalsy();
                });
            });
        });
    });
});
