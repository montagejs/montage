/* <copyright>
Copyright (c) 2012, Benoit Marchant.
All Rights Reserved.
</copyright> */

/**
    @module "montage/ui/native/button.reel"
    @requires montage/core/core
    @requires montage/ui/component
    @requires montage/ui/native-control
    @requires montage/ui/composer/press-composer
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    SubmitButton = require("ui/native/submit-button.reel").SubmitButton;

/**
    Wraps a native <code>&lt;button></code> or <code>&lt;input[type="button"]></code> HTML element. The element's standard attributes are exposed as bindable properties.
    @class module:"montage/ui/native/submit-button.reel".Button
    @extends module:montage/ui/native/button.reel.Button
    @fires action
    @fires hold
    @example
*/
var ImageButton = exports.ImageButton = Montage.create(SubmitButton, /** @lends module:"montage/ui/native/image-button.reel".ImageButton# */ {

});

//http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#image-button-state-(type=image)
// //Image Button state (type=image)
//The following common input element content attributes and IDL attributes apply to the element:
// alt, formaction, formenctype, formmethod, formnovalidate, formtarget, height, src, and width content attributes; value IDL attribute.

ImageButton.addAttributes( /** @lends module:"montage/ui/native/image-button.reel".Button# */{
    alt: null,
    height: null,
    src: null,
    width: null
});
