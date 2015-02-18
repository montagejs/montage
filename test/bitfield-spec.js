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
    BitField = require("montage/core/bitfield").BitField;

describe("bitfield-spec",
function () {
    describe("creating empty bitfield",
    function () {
        var bitField = new BitField();
        it("should be true",
        function () {
            expect(bitField.value).toBeTruthy();
        });
    });
    describe("creation with four false fields",
    function () {
        var bitField;

        beforeEach(function () {
            bitField = new BitField().initWithDescriptor({
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
        function () {
            expect(bitField._fieldCount).toEqual(4);
        });

        describe("set one of its fields to true",
        function () {
            beforeEach(function () {
                bitField.B = true;
            });
            afterEach(function () {
                bitField.B = false;
            });
            it("should be false",
            function () {
                expect(bitField.value).toBeFalsy();
            });
        });

        describe("set all of its fields to true",
        function () {
            beforeEach(function () {
                bitField.A = true;
                bitField.B = true;
                bitField.C = true;
                bitField.D = true;
            });
            it("should be true",
            function () {
                expect(bitField.value).toBeTruthy();
            });
            describe("add a false field",
            function () {
                beforeEach(function () {
                    bitField.addField("E");
                });
                it("should be false",
                function () {
                    expect(bitField.value).toBeFalsy();
                });
            });
        });
    });
});
