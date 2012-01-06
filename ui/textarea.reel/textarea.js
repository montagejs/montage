/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
Component = require("ui/component").Component,
TextInput = require("ui/text-input").TextInput;
    
var TextArea = exports.TextArea = Montage.create(TextInput, {
    deserializedFromTemplate: {
        value: function() {
            // @todo - Need a better way to do this. 
            var fn = Object.getPrototypeOf(TextArea).deserializedFromTemplate;
            fn.call(this);
            var text = this.element.textContent;
            this.value = text || '';
        }
    }
});

TextArea.addProperties({        
        autofocus: null,
        cols: null,
        dirname: null,
        disabled: {dataType: 'boolean'},
        form: null,        
        maxlength: null,
        name: null,
        placeholder: null,
        readonly: {dataType: 'boolean'},
        required: {dataType: 'boolean'},
        rows: null,
        wrap: null
});
