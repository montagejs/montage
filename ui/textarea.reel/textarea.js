/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
Component = require("ui/component").Component,
UserInput = require("ui/user-input").UserInput;
    
var TextArea = exports.TextArea = Montage.create(UserInput, {
    
    // if there is existing textContent in the markup, use that as default value
    deserializedFromTemplate: {
        value: function() {
            var fn = Object.getPrototypeOf(TextArea).deserializedFromTemplate;
            fn.call(this);
            var text = this.element.textContent;
            this.value = text || '';
            console.log('textarea default value = ' + text);
        }
    }

});

TextArea.addProperties({        
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
        title: '',
        type: {value: 'text'}
        // width: ''
});
