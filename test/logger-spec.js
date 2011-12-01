/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    loggerRequire = require("montage/core/logger");

describe("logger-spec",
function() {
    describe("get a logger",
    function() {
        it("shoud be the same logger for the same name",
        function() {
            var loggerA = loggerRequire.logger("testMyName", true);
            var loggerB = loggerRequire.logger("testMyName", true);
            expect(loggerA).toBe(loggerB);
        });
    });
    describe("defaults",
    function() {
        it("should be disabled by default",
        function() {
            var loggerA = loggerRequire.logger("testLogger", true);
            expect(loggerA.isDebug).toBeFalsy();
            expect(loggerA.isError).toBeTruthy();
        });
    });
    describe("activation",
    function() {
        it("should activated by assigning truthy value",
        function() {
            var loggerA = loggerRequire.logger("testLogger2", true);
            expect(loggerA.isDebug).toBeFalsy();
            loggerA.isDebug = true;
            expect(loggerA.debug).toEqual(loggerA.error);
        });
    });
});
