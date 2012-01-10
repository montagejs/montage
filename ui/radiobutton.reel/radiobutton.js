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
var Radiobutton = exports.Radiobutton = Montage.create(CheckInput, {
    prepareForDraw: {
        enumerable: false,
        value: function() {
            // Bind the listener to all radio buttons with this name, so that
            // we get an event when another radio button is checked, causing
            // this one to be unchecked.
            // This function binds a listener to this radio button, so we don't
            // need to call the super method.
            var i, name = this.element.getAttribute("name"), others;
            if (name) {
                others = document.querySelectorAll('input[name="'+ name +'"]');
                for (i = 0; i < others.length; i++) {
                    others[i].addEventListener('change', this);
                }
            }

        }
    }
});
Radiobutton.addProperties({
    autofocus: 'off', // on/off
    disabled: {value: false, dataType: 'boolean'},
    form: null,
    formenctype: null,
    name: null,
    placeholder: null,
    readonly: {value: false, dataType: 'boolean'},
    required: {value: false, dataType: 'boolean'},
    src: null,
    title: null,
    value: {value: 'on'}
});
