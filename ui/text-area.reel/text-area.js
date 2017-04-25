/**
    @module "montage/ui/native/textarea.reel"
*/

var TextInput = require("ui/text-input").TextInput;

/**
 * Wraps the a &lt;textarea> element with binding support for the element's standard attributes. Uses an ArrayController instance to manage the element's contents and selection.
   @class module:"montage/ui/native/textarea.reel".Textarea
   @extends module:montage/ui/text-input.TextInput
 */

var TextArea = exports.TextArea = TextInput.specialize(/** @lends module:"montage/ui/native/textarea.reel".Textarea# */ {
    hasTemplate: {value: false }
});

TextArea.addAttributes( /** @lends module:"montage/ui/native/textarea.reel".Textarea# */ {

/**
    The maximum number of characters per line of text to display.
    @type {number}
    @default null
*/
        cols: null,

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
