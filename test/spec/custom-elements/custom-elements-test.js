
var querySelector = function (e) { return document.querySelector(e); }

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Application = require("montage/core/application").application;
var MontageText = require("montage/ui/text.reel").Text;
var MyButton = require("spec/custom-elements/my-button.reel").MyButton;

var CustomElementTest = exports.CustomElementTest = Montage.specialize({
    textLabel2: {
        value: 'textLabel2'
    }
});
