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
    Enum = require("montage/core/enum").Enum;

describe("enum-spec",
function () {
    describe("initialization",
    function () {
        var TestEnum = new Enum().initWithMembers("ZERO","ONE","TWO");
        it("should define properties",
        function () {
            expect(Object.getOwnPropertyDescriptor(TestEnum, "ZERO")).not.toBeNull();
            expect(Object.getOwnPropertyDescriptor(TestEnum, "ONE")).not.toBeNull();
            expect(Object.getOwnPropertyDescriptor(TestEnum, "TWO")).not.toBeNull();
        });
        it("should be use incremental values",
        function () {
            expect(TestEnum.ZERO).toEqual(0);
            expect(TestEnum.ONE).toEqual(1);
            expect(TestEnum.TWO).toEqual(2);
        });
        it("should not be editable",
        function () {
            TestEnum.ZERO = 666;
            expect(TestEnum.ZERO).toEqual(0);
        });
        it("should not be extensible",
        function () {
            TestEnum = new Enum().initWithMembers("ZERO","ONE","TWO");
            expect(function () {
                TestEnum.addMember("THREE");
            }).toThrow();
         });
     });
    describe("adding a member",
    function () {
        var TestEnum = new Enum().init();
        TestEnum.addMember("ZERO");
        TestEnum.addMember("ONE");
        TestEnum.addMember("TWO");
        TestEnum.addMember("THREE");
        TestEnum.seal();
        it("should define a property",
        function () {
            expect(Object.getOwnPropertyDescriptor(TestEnum, "THREE")).not.toBeNull();
        });
        it("should be use incremental values",
        function () {
            expect(TestEnum.THREE).toEqual(3);
        });
    });
});
