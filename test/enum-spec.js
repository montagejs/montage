/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Enum = require("montage/core/enum").Enum;

describe("enum-spec",
function() {
    describe("initialization",
    function() {
        var TestEnum = Montage.create(Enum).initWithMembers("ZERO","ONE","TWO");
        it("should define properties",
        function() {
            expect(Object.getOwnPropertyDescriptor(TestEnum, "ZERO")).not.toBeNull();
            expect(Object.getOwnPropertyDescriptor(TestEnum, "ONE")).not.toBeNull();
            expect(Object.getOwnPropertyDescriptor(TestEnum, "TWO")).not.toBeNull();
        });
        it("should be use incremental values",
        function() {
            expect(TestEnum.ZERO).toEqual(0);
            expect(TestEnum.ONE).toEqual(1);
            expect(TestEnum.TWO).toEqual(2);
        });
        it("should not be editable",
        function() {
            TestEnum.ZERO = 666;
            expect(TestEnum.ZERO).toEqual(0);
        });
        it("should not be extensible",
        function() {
            TestEnum = Montage.create(Enum).initWithMembers("ZERO","ONE","TWO");
            expect(function() {
                TestEnum.addMember("THREE");
            }).toThrow();
         });
     });
    describe("adding a member",
    function() {
        var TestEnum = Montage.create(Enum).init();
        TestEnum.addMember("ZERO");
        TestEnum.addMember("ONE");
        TestEnum.addMember("TWO");
        TestEnum.addMember("THREE");
        TestEnum.seal();
        it("should define a property",
        function() {
            expect(Object.getOwnPropertyDescriptor(TestEnum, "THREE")).not.toBeNull();
        });
        it("should be use incremental values",
        function() {
            expect(TestEnum.THREE).toEqual(3);
        });
    });
});
