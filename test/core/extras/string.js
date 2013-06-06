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

require("montage");

describe("core/extras/string", function () {

    describe("String#equals", function () {

        it("should recognize a string", function () {
            expect("abc".equals("abc")).toBe(true);
        });

        it("should recognize a boxed string", function () {
            expect("abc".equals(new String("abc"))).toBe(true);
        });

        it("should distinguish a number containing the same value", function () {
            expect("0".equals(0)).toBe(false);
        });

    });

    describe("String#contains", function () {

        it("should recognize a substring", function () {
            expect("abc".contains("bc")).toBe(true);
        });

        it("should distinguish a non-existent substring", function () {
            expect("abc".contains("cde")).toBe(false);
        });

    });

    describe("String#toCapitalized", function () {

        it("should capitalize the first and only the first character", function () {
            expect("der herr der ringe".toCapitalized()).toEqual("Der herr der ringe");
        });

    });

    // not much to test with addEventListener that would not be independently
    // verified by generic event listener tests

});

