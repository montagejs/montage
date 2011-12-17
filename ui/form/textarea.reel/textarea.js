/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    FormField = require("ui/form/form-field").FormField;

var TextArea = exports.TextArea = Montage.create(FormField, {
    
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
