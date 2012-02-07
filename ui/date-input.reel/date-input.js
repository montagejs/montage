/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput;
/**
 * The Component wrapper for input type="date"
 */
var DateInput = exports.DateInput = Montage.create(TextInput, {
});

DateInput.addAttributes({
    max: null,
    min: null,
    step: null // 'any' or a floating point number
});