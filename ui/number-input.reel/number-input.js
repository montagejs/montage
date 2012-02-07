/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput;
/**
 * The Number input
 */
var NumberInput = exports.NumberInput = Montage.create(TextInput, {

});

NumberInput.addAttributes({
    max: {dataType: 'number'},
    min: {dataType: 'number'},
    step: null // number or 'any'
});
