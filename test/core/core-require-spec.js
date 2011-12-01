/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    objects = require("./testobjects");

describe("core-require-spec",
function() {
    describe("Object Information",
    function() {
        it("should describe a class object",
        function() {
            var info = Montage.getInfoForObject(objects.Proto);

            expect(info.objectName).toBe("Proto");
            expect(info.isInstance).toBeFalsy();
            expect(info.moduleId).toBe("core/testobjects");
        });
        it("should describe a subclass object",
        function() {
            var info = Montage.getInfoForObject(objects.SubProto);

            expect(info.objectName).toBe("SubProto");
            expect(info.isInstance).toBeFalsy();
            expect(info.moduleId).toBe("core/testobjects");
        });
        it("should describe a class instance object",
        function() {
            var instance = objects.Simple.create();
            var info = Montage.getInfoForObject(instance);

            expect(info.objectName).toBe("Simple");
            expect(info.isInstance).toBeTruthy();
            expect(info.moduleId).toBe("core/testobjects");
        });

        it("should describe a function instance object",
        function() {
            var instance = new objects.Funktion();
            var info = Montage.getInfoForObject(instance);

            expect(info.objectName).toBe("Funktion");
            expect(info.isInstance).toBeTruthy();
            expect(info.moduleId).toBe("core/testobjects");
        });
    });
});
