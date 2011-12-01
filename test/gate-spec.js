/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Gate = require("montage/core/gate").Gate;

describe("gate-spec",
function() {
    describe("creating empty gate",
    function() {
        var gate = Gate.create().init();
        it("should be true",
        function() {
            expect(gate.value).toBeTruthy();
        });
    });
    describe("creation with four false fields",
    function() {
        var gate;

        beforeEach(function() {
            gate = Gate.create().initWithDescriptor({
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

        it("should have the expected false field count",
        function() {
            expect(gate.count).toEqual(4);
        });

        describe("set one of its fields to true",
        function() {
            beforeEach(function() {
                gate.setField("B",true);
            });
            afterEach(function() {
                gate.setField("B",false);
            });
            it("should be false",
            function() {
                expect(gate.value).toBeFalsy();
            });
        });

        describe("set all of its fields to true",
        function() {
            beforeEach(function() {
                gate.setField("A",true);
                gate.setField("B",true);
                gate.setField("C",true);
                gate.setField("D",true);
            });
            it("should be true",
            function() {
                expect(gate.value).toBeTruthy();
            });
            describe("add a false field",
            function() {
                beforeEach(function() {
                    gate.setField("E");
                });
                it("should be false",
                function() {
                    expect(gate.value).toBeFalsy();
                });
            });
        });
    });
});
