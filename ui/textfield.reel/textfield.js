/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    UserInput = require("ui/user-input").UserInput;
/**
 * The Text input
 */
var Textfield = exports.Textfield = Montage.create(UserInput, {

});

Textfield.addProperties({        
        accept: '',
        alt: '',
        autocomplete: '',
        autofocus: 'off', // on/off
        dirname: '',
        disabled: {value: 'false', dataType: 'boolean'},
        form: '',
        formaction: '',
        formenctype: '',
        formmethod: '',
        formnovalidate: 'false',
        formtarget: '',
        list: '', // list of autocomplete options
        maxlength: '',
        multiple: 'false',
        name: '',
        pattern: '',
        placeholder: '',
        readonly: {value: 'false', dataType: 'boolean'},
        required: {value: 'false', dataType: 'boolean'},
        size: '',
        src: '',
        title: ''
        //type: 'text'
        // type is intentionally left out as this must be specified in the markup
        // and is not bindable
        // width: ''
});

/*

{        
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
        //height: '',
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
        type: ''
        // width: ''
}*/
