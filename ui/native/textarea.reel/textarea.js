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
    @module "montage/ui/native/textarea.reel"
    @requires montage/ui/component
    @requires montage/ui/text-input
*/

var Montage = require("montage").Montage,
Component = require("ui/component").Component,
TextInput = require("ui/text-input").TextInput;

/**
 * Wraps the a &lt;textarea> element with binding support for the element's standard attributes. Uses an ArrayController instance to manage the element's contents and selection.
   @class module:"montage/ui/native/textarea.reel".Textarea
   @extends module:montage/ui/text-input.TextInput
 */

var Textarea = exports.Textarea = Montage.create(TextInput, /** @lends module:"montage/ui/native/textarea.reel".Textarea# */ {

    select: { value: function() { this._element.select(); } },

    /**
        The text display by the Textarea component's element.
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
    },

    willPrepareForDraw: {
        value: function() {
            TextInput.willPrepareForDraw.call(this);
            if(this.textContent === null) {
                this.textContent = this.element.textContent;
            }
        }
    }

});

Textarea.addAttributes( /** @lends module:"montage/ui/native/textarea.reel".Textarea# */ {
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
