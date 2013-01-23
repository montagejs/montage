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
    @module montage/ui/native-control
    @requires montage/core/core
    @requires montage/ui/component
*/

var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    Base component for all native components, such as RadioButton and Checkbox.
    @class module:montage/ui/native-control.NativeControl
    @extends module:montage/ui/component.Component
 */
var NativeControl = exports.NativeControl = Montage.create(Component, /** @lends module:montage/ui/native-control.NativeControl# */ {

    hasTemplate: {
        value: false
    },

    willPrepareForDraw: {
        value: function() {
        }
    }
});

//http://www.w3.org/TR/html5/elements.html#global-attributes
NativeControl.addAttributes( /** @lends module:montage/ui/native-control.NativeControl# */ {

/**
    Specifies the shortcut key(s) that gives focuses to or activates the element.
    @see {@link http://www.w3.org/TR/html5/editing.html#the-accesskey-attribute}
    @type {string}
    @default null
*/
    accesskey: null,

/**
    Specifies if the content is editable or not. Valid values are "true", "false", and "inherit".
    @see {@link http://www.w3.org/TR/html5/editing.html#contenteditable}
    @type {string}
    @default null

*/
    contenteditable: null,

/**
    Specifies the ID of a <code>menu</code> element in the DOM to use as the element's context menu.
    @see  {@link http://www.w3.org/TR/html5/interactive-elements.html#attr-contextmenu}
    @type {string}
    @default null
*/
    contextmenu: null,

/**
    Specifies the elements element's text directionality. Valid values are "ltr", "rtl", and "auto".
    @see {@link http://www.w3.org/TR/html5/elements.html#the-dir-attribute}
    @type {string}
    @default null
*/
    dir: null,

/**
    Specifies if the element is draggable. Valid values are "true", "false", and "auto".
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/dnd.html#the-draggable-attribute}
*/
    draggable: null,

/**
    Specifies the behavior that's taken when an item is dropped on the element. Valid values are "copy", "move", and "link".
    @type {string}
    @see {@link http://www.w3.org/TR/html5/dnd.html#the-dropzone-attribute}
*/
    dropzone: null,

/**
    When specified on an element, it indicates that the element should not be displayed.
    @type {boolean}
    @default false
*/
    hidden: {dataType: 'boolean'},
    //id: null,

/**
    Specifies the primary language for the element's contents and for any of the element's attributes that contain text.
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/elements.html#attr-lang}
*/
    lang: null,

/**
    Specifies if element should have its spelling and grammar checked by the browser. Valid values are "true", "false".
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/editing.html#attr-spellcheck}
*/
    spellcheck: null,

/**
    The CSS styling attribute.
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/elements.html#the-style-attribute}
*/
    style: null,

/**
     Specifies the relative order of the element for the purposes of sequential focus navigation.
     @type {number}
     @default null
     @see {@link http://www.w3.org/TR/html5/editing.html#attr-tabindex}
*/
    tabindex: null,

/**
    Specifies advisory information about the element, used as a tooltip when hovering over the element, and other purposes.
    @type {string}
    @default null
    @see {@link http://www.w3.org/TR/html5/elements.html#the-title-attribute}
*/
    title: null
});
