/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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

Input.addAttributes({
    accept: null,
    alt: null,
    autocomplete: null,
    /**
        Specifies if the checkbox control should receive focus when the document loads. Because Montage components are loaded asynchronously after the document has loaded, setting this property has no effect on the element's focus state.
        @type {boolean}
        @default false
    */
    autofocus: {value: false, dataType: 'boolean'},
    /**
        Specifies if the checkbox is in it checked state or not.
        @type {boolean}
        @default false
    */
    checked: {value: false, dataType: 'boolean'},
    dirname: null,
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
    formaction: null,//Should be formAction per IDL
    formenctype: null,
    formmethod: null,
    formnovalidate: {dataType: 'boolean'},
    formtarget: null,
    height: null,
    list: null,
    maxlength: null,
    multiple: {dataType: 'boolean'},
    /**
        The name part of the name/value pair associated with this element for the purposes of form submission.
        @type {string}
        @default null
    */
    name: null,
    pattern: null,
    placeholder: null,
    /**
        Specifies if this control is readonly.
        @type {boolean}
        @default false
    */
    readonly: {value: false, dataType: 'boolean'},
    required: {dataType: 'boolean'},
    size: null,
    src: null,
    width: null
    // "type" is not bindable and "value" is handled as a special attribute
});
