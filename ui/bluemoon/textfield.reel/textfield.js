/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/bluemoon/textfield.reel"
    @requires montage/core/core
    @requires montage/ui/editable-text
*/
var Montage = require("montage").Montage,
    EditableText = require("ui/editable-text").EditableText;
/**
    @class module:"montage/ui/bluemoon/textfield.reel".Textfield
    @extends module:montage/ui/editable-text.EditableText
*/
var Textfield = exports.Textfield = Montage.create(EditableText,/** @lends module:"montage/ui/bluemoon/textfield.reel".Textfield# */ {
/**
        Description TODO
        @type {Property}
        @default null
    */
    delegate: {
        enumerable: true,
        value: null
    },
    
    _placeholder: {
        value: null
    },
    
    placeholder: {
        get: function() {
            return this._placeholder;
        },
        set: function(value) {
            if(this._placeholder !== value) {
                this._placeholder = value;
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _drawSpecific: {
        enumerable: false,
        value: function() {
            this.element.classList.add('montage-textfield');
            
            this.element.placeholder = this._placeholder;
        }
    }
});

