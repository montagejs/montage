/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    UserInput = require("ui/user-input").UserInput;
/**
 * The input type=range 
 */
var Range = exports.Range = Montage.create(UserInput, {

});

Range.addProperties({        
        accept: '',
        alt: '',
        autocomplete: '',
        autofocus: 'off', // on/off
        checked: {value: 'false', dataType: 'boolean'},
        dirname: '',
        disabled: {value: 'false', dataType: 'boolean'},
        form: '',
        formaction: '',
        formenctype: '',
        formmethod: '',
        formnovalidate: 'false',
        formtarget: '',
        list: '', // list of autocomplete options
        max: '',
        maxlength: '',
        min: '',
        multiple: 'false',
        name: '',
        pattern: '',
        placeholder: '',
        readonly: {value: 'false', dataType: 'boolean'},
        required: {value: 'false', dataType: 'boolean'},
        size: '',
        src: '',
        step: '',
        title: '',
        type: {value: 'range'}
});