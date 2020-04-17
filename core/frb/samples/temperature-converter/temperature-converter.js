
var Bindings = require("frb");
var PrecisionConverter = require("./precision-converter");

// the DOM module adds support for property change listeners to the DOM element
// prototypes
require("frb/dom");

var bindings = Bindings.defineBindings({}, {

    // controller:
    "fahrenheit": {"<->": "celsius * 1.8 + 32"},
    "celsius": {"<->": "kelvin - 272.15"},

    // view:
    // the + operator coerces the string to a number.
    // the # operator reaches into the document property for the corresponding
    // element.
    "#fahrenheit.value": {"<->": "+fahrenheit",
        converter: new PrecisionConverter(1)
    },
    "#celsius.value": {"<->": "+celsius",
        converter: new PrecisionConverter(1)
    },
    "#kelvin.value": {"<->": "+kelvin",
        converter: new PrecisionConverter(1)
    }

}, {
    document: document
});

bindings.celsius = 0;

