/* <copyright>
Copyright (c) 2012, Benoit Marchant.
All Rights Reserved.
</copyright> */


/**
    @module montage/ui/submit-button
    @requires montage/ui/native-control
    @requires montage/core/core
*/
var Montage = require("montage").Montage,
    Button = require("ui/native/button.reel").Button;

/**
    The base class for all button like input: reset, image, submit components. You typically won't create instances of this prototype.
    @class module:montage/ui/submit-button-input.SubmitButonInput
    @extends module:montage/ui/input.Input

*/
var SubmitButton = exports.SubmitButton =  Montage.create(Button, /** @lends module:montage/ui/button-input.ButtonInput# */ {


});

// Standard <input> tag attributes - http://www.w3.org/TR/html5/the-input-element.html#the-input-element
//http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#submit-button-state-(type=submit)
// //Submit Button state (type=submit)
//The following common input element content attributes and IDL attributes apply to the element:
// formaction, formenctype, formmethod, formnovalidate, and formtarget content attributes; value IDL attribute.


SubmitButton.addAttributes({
    formaction: null,//Should be formAction per IDL
    formenctype: null,
    formmethod: null,
    formnovalidate: {dataType: 'boolean'},
    formtarget: null
});
