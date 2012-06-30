/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    TestController = require("support/test-controller").TestController;

var Test = exports.TestController = Montage.create(TestController, {

    dynamicElement: {
        value: null
    },

    dynamicElementClassList: {
        value: null
    },

    dynamicElementClassInMarkup: {
        value: null
    },

    class1: {
        value: true
    },

    class2: {
        value: false
    }
});
exports.theTest = Test.create();
