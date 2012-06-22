/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports,describe,it,expect */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader;

var testPage = TestPageLoader.queueTest("{{name}}-test", function() {
    var test = testPage.test;

    describe("ui/{{name}}-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("{{title}}", function(){
           it("can be created", function() {
               expect(test.testedComponent).toBeDefined();
           });
           // … and more
        });
    });
});
