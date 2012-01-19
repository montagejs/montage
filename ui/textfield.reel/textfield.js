/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    TextInput = require("ui/text-input").TextInput,
    StandardInputAttributes = require("ui/text-input").StandardInputAttributes;
/**
 * The Text input
 */
var Textfield = exports.Textfield = Montage.create(TextInput, {
    hasTemplate: {value: true}
});

// Standard <input> tag attributes - http://www.w3.org/TR/html5/the-input-element.html#the-input-element
Textfield.addProperties(StandardInputAttributes);
