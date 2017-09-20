
var Component = require("montage/ui/component").Component;
var Button = require("montage/ui/button.reel").Button;

var MyButton = exports.MyButton = Button.specialize({
    hasTemplate: {
        value: true
    }
});

if (window.MontageElement) {
    MontageElement.define("my-button", MyButton, {
        observedAttributes: ['label']
    });
}
