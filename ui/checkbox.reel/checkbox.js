/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    CheckInput = require("ui/check-input").CheckInput;
/**
 * The Text input
 */
var Checkbox = exports.Checkbox = Montage.create(CheckInput, {});
Checkbox.addProperties({
    autofocus: 'off', // on/off
    disabled: {value: 'false', dataType: 'boolean'},
    form: '',
    formenctype: '',
    name: null,
    placeholder: '',
    readonly: {value: 'false', dataType: 'boolean'},
    required: {value: 'false', dataType: 'boolean'},
    src: '',
    title: '',
    value: {value: 'on'}
});
