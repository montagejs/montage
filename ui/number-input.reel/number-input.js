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

NumberInput.addProperties({        
        alt: null,
        autocomplete: null,
        dirname: null,
        disabled: {dataType: 'boolean'},
        list: null, // list of autocomplete options
        max: null,
        maxlength: null,
        min: null,
        multiple: null,
        name: null,
        pattern: null,
        placeholder: null,
        readonly: {dataType: 'boolean'},
        required: {dataType: 'boolean'},
        size: null,
        src: null,
        step: null,
        title: null
        //type: 'text'
        // type is intentionally left out as this must be specified in the markup
        // and is not bindable
        // width: ''
});
