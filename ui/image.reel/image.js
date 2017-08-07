/**
    @module "montage/ui/native/image.reel"
    @requires montage/ui/component
    @requires montage/ui/native-control
*/
var Component = require("ui/component").Component;

/**
 * Wraps the a &lt;img> element with binding support for its standard attributes.
   @class module:"montage/ui/native/image.reel".Image
   @extends module:montage/ui/control.Control
 */
var Image = exports.Image = Component.specialize({
    hasTemplate: {value: false }
});

Image.addAttributes(/** @lends module:"montage/ui/native/image.reel".Image */{

/**
    A text description to display in place of the image.
    @type {string}
    @default null
*/
        alt: null,

/**
    The height of the image in CSS pixels.
    @type {number}
    @default null
*/
        height: null,

/**
    The URL where the image is located.
    @type {string}
    @default null
*/
        src: null,

/**
    The width of the image in CSS pixels.
    @type {number}
    @default null
*/
        width: null


});
