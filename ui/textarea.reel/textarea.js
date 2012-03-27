/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    @module "montage/ui/textarea.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
*/

var Montage = require("montage").Montage,
Component = require("ui/component").Component,
TextInput = require("ui/text-input").TextInput;

/**
 * Wraps the a &lt;textarea> element with binding support for the element's standard attributes. Uses an ArrayController instance to manage the element's contents and selection.
   @class module:"montage/ui/textarea.reel".TextArea
   @extends module:montage/text-input.TextInput
 */
var TextArea = exports.TextArea = Montage.create(TextInput, {

/**
    The text display by the TextArea component's element.
    @type {string}
    @default ""
*/

    textContent: {
        get: function() {
            return this.value;
        },
        set: function(v) {
            this.value = v;
        }
    }

});

TextArea.addAttributes({
/**
    Specifies whether the element should be focused as soon as the page is loaded.
    @type {boolean}
    @default false
*/
        autofocus: {dataType: 'boolean'},

/**
    The maximum number of characters per line of text to display.
    @type {number}
    @default null
*/
        cols: null,

/**
    The name of the field that contains that value that specifies the element's directionality.
    @type {string}
    @default  null
*/
        dirname: null,

/**
    When true, the textarea element is disabled to user input, and "disabled" is added to the element's CSS class list.
    @type {boolean}
    @default false
*/
        disabled: {dataType: 'boolean'},

/**
    The value of the <code>id</code> attribute of the form with which to associate the component's element.
    @type string}
    @default null
*/
        form: null,

/**
    The maximum allowed value length of the element.
    @type {number}
    @default null
*/
        maxlength: null,

/**
    The name associated with the textarea element.
    @type {string}
    @default null
*/
        name: null,

/**
    Placeholder text to display in the textarea before the user has entered any text.
    @type {string}
    @default null
*/
        placeholder: null,

/**
    Specifies if this control is readonly.
    @type {boolean}
    @default false
*/
        readonly: {dataType: 'boolean'},

/**
    When true, the user will be required to enter a value in the textarea before submitting the form.
    @type {string}
    @default false
*/
        required: {dataType: 'boolean'},

/**
    The number of lines of text the browser should render for the textarea.
    @type {number}
    @default null
*/
        rows: null,

/**
    If the value of this property is "hard", the browser will insert line breaks such that each line of user input has no more characters than the value specified by the <code>cols</code> property. If the value is "soft" then no line breaks will be added.
    @type {string}
    @default
*/
        wrap: null
});
