/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/bluemoon/textarea.reel"
    @requires montage/core/core
    @requires montage/ui/editable-text
*/
var Montage = require("montage").Montage,
    EditableText = require("ui/editable-text").EditableText;
/**
    @class module:"montage/ui/bluemoon/textarea.reel".TextArea
    @classdesc TextArea component - multiline text field
    @extends module:montage/ui/editable-text.EditableText
*/
exports.TextArea = Montage.create(EditableText, /** @lends module:"montage/ui/bluemoon/textarea.reel".TextArea# */{
/**
  Description TODO
  @private
*/
    _drawSpecific: {
        enumerable: false,
        value: function() {
            this.element.classList.add('montage-textarea');
        }
    }
});
