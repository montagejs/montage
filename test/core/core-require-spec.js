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
    objects = require("./testobjects");

describe("core-require-spec",
function () {
    describe("Object Information",
    function () {
        it("should describe a class object",
        function () {
            var info = Montage.getInfoForObject(objects.Proto);

            expect(info.objectName).toBe("Proto");
            expect(info.isInstance).toBeFalsy();
            expect(info.moduleId).toBe("core/testobjects");
        });
        it("should describe a subclass object",
        function () {
            var info = Montage.getInfoForObject(objects.SubProto);

            expect(info.objectName).toBe("SubProto");
            expect(info.isInstance).toBeFalsy();
            expect(info.moduleId).toBe("core/testobjects");
        });
        it("should describe a class instance object",
        function () {
            var instance = new objects.Simple();
            var info = Montage.getInfoForObject(instance);

            expect(info.objectName).toBe("Simple");
            expect(info.isInstance).toBeTruthy();
            expect(info.moduleId).toBe("core/testobjects");
        });

        it("should describe a function instance object",
        function () {
            var instance = new objects.Funktion();
            var info = Montage.getInfoForObject(instance);

            expect(info.objectName).toBe("Funktion");
            expect(info.isInstance).toBeTruthy();
            expect(info.moduleId).toBe("core/testobjects");
        });

        it("should describe a class object that accessed getInfoForObject before being exported",
        function () {
            var info = Montage.getInfoForObject(objects.FunkyProto);

            expect(info.objectName).toBe("FunkyProto");
            expect(info.isInstance).toBeFalsy();
            expect(info.moduleId).toBe("core/testobjects");
        });

        it("should not be added to the Object constructor", function () {
            Montage.getInfoForObject(Object.prototype);

            var instance = new objects.Simple();
            var info = Montage.getInfoForObject(instance);

            expect(info.objectName).toBe("Simple");
            expect(info.isInstance).toBeTruthy();
            expect(info.moduleId).toBe("core/testobjects");

            expect(Object.prototype.hasOwnProperty("_montage_metadata")).toBe(false);
        });
    });
});
