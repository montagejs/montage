var querySelector = function(e){return document.querySelector(e);}

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.AlternationTest = Montage.specialize( {
    listener: {value: function() {

    }},
    simpleArrayController: {value: null}
});
