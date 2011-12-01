/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/richtextfield.reel"
    @requires montage/core/core
    @requires montage/ui/editable-text
*/
var Montage = require("montage").Montage,
    EditableText = require("ui/editable-text").EditableText;
/**
    @class module:"montage/ui/richtextfield.reel".RichTextfield
    @extends module:montage/ui/editable-text.EditableText
*/
var RichTextfield = exports.RichTextfield = Montage.create(EditableText,/** @lends module:"montage/ui/richtextfield.reel".RichTextfield# */ {
    /**
    Description TODO
    @type {Property}
    @default null
    */
    delegate: {
        enumerable: true,
        value: null
    },

    /**
    Description TODO
    @private
    */
    _drawSpecific: {
        enumerable: false,
        value: function() {
            this.element.classList.add('montage-richtextfield');
        }
    },

    /**
    Description TODO
    Overwrite
    @private
    */
    _setElementValue: {
        value: function(v) {
            this.element.innerHTML = v;
        }
    },

    // Callbacks
    /**
    Description TODO
    Overwrite
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var el = this.element;

            // call super first
            EditableText.prepareForDraw.call(this);
            
            el.setAttribute("contentEditable", "true");
        }
    }
});

