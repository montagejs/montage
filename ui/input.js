/* <copyright>
Copyright (c) 2012, Benoit Marchant.
All Rights Reserved.
</copyright> */

/**
    @module montage/ui/text-input
    @requires montage/ui/component
    @requires montage/ui/native-control
    @requires montage/core/core
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;

/**
    The base class for all input components. You typically won't create instances of this prototype.
    @class module:montage/ui/input.Input
    @extends module:montage/ui/native-control.NativeControl
 @see {module:"montage/ui/input-date.reel".TextInput
 @see {module:"montage/ui/input-date.reel".CheckInput
    @see {module:"montage/ui/input-date.reel".DateInput
    @see module:"montage/ui/input-text.reel".InputText
    @see module:"montage/ui/input-number.reel".InputNumber
    @see module:"montage/ui/input-range.reel".RangeInput
    @see module:"montage/ui/textarea.reel".TextArea

*/
var Input = exports.Input =  Montage.create(NativeControl, /** @lends module:montage/ui/input.Input# */ {

    // HTMLInputElement methods

    blur: { value: function() { this._element.blur(); } },
    focus: { value: function() { this._element.focus(); } }



});

// Standard <input> tag attributes - http://www.w3.org/TR/html5/the-input-element.html#the-input-element

//http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#checkbox-state-(type=checkbox)

//The following content attributes must not be specified and do not apply to the input type=text element:
// accept, alt, checked, formaction, formenctype, formmethod, formnovalidate, formtarget, height, max, min, multiple, src, step, and width.


//The following content attributes must not be specified and do not apply to the input type=checkbox element:
// accept, alt, autocomplete, dirname, formaction, formenctype, formmethod, formnovalidate, formtarget, height, inputmode, list, max, maxlength, min,
// multiple, pattern, placeholder, readonly, size, src, step, and width.


Input.addAttributes({
    /**
        Specifies if the checkbox control should receive focus when the document loads. Because Montage components are loaded asynchronously after the document has loaded, setting this property has no effect on the element's focus state.
        @type {boolean}
        @default false
    */
    autofocus: {value: false, dataType: 'boolean'},
    /**
        Specifies if the checkbox control is disabled.
        @type {boolean}
        @default false
    */
    disabled: {value: false, dataType: 'boolean'},
    /**
        The value of the id attribute of the form with which to associate the element.
        @type {string}
        @default null
    */
    form: null,
    /**
        The name part of the name/value pair associated with this element for the purposes of form submission.
        @type {string}
        @default null
    */
    name: null,
    value: null

});
