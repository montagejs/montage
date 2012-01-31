/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    CheckInput = require("ui/check-input").CheckInput;

var Checkbox = exports.Checkbox = Montage.create(CheckInput, {});
Checkbox.addProperties({
    autofocus: 'off', // on/off
    disabled: {value: false, dataType: 'boolean'},
    checked: {value: false, dataType: 'boolean'},
    form: null,
    name: null,
    readonly: {value: false, dataType: 'boolean'},
    title: null,
    /*
    "On getting, if the element has a value attribute, it must return that
    attribute's value; otherwise, it must return the string "on". On setting,
    it must set the element's value attribute to the new value."
    http://www.w3.org/TR/html5/common-input-element-attributes.html#dom-input-value-default-on
    */
    value: {value: 'on'}
});
