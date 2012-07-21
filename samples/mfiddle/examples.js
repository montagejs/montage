exports.examples = [
    {
        label: "A simple Component",
        css: "",
        serialization: {
            "owner": {
                "properties": {
                    "element": {"#": "component"}
                }
            },
            "button": {
                "prototype": "montage/ui/button.reel",
                "properties": {
                    "element": {"#": "button"},
                    "label": "Click Me!"
                }
            }
        },
        html: '<div data-montage-id="component">\n\t<button data-montage-id="button"></button>\n</div>',
        javascript: 'var Montage = require("montage").Montage,\n    Component = require("montage/ui/component").Component;\n\nexports.Owner = Montage.create(Component, {\n    templateDidLoad: {\n        value: function() {\n            console.log("templateDidLoad");\n        }\n    }\n});\n'
    },
    {
        label: "A simple Button",
        css: "",
        serialization: {
            "button": {
                "prototype": "montage/ui/bluemoon/button.reel",
                "properties": {
                    "element": {"#": "button"},
                    "value": "Click Me!"
                }
            }
        },
        html: '<div data-montage-id="button" class="text"></div>',
        javascript: ""
    },
    {
        label: "A simple Binding",
        css: "",
        serialization: {
            "slider": {
                "prototype": "montage/ui/bluemoon/slider.reel",
                "properties": {
                    "element": {"#": "slider"},
                    "value": 50
                }
            },

            "dynamicText": {
                "prototype": "montage/ui/dynamic-text.reel",
                "properties": {
                    "element": {"#": "dynamicText"}
                },
                "bindings": {
                    "value": {"<-": "@slider.value"}
                }
            }
        },
        html: '<div data-montage-id="slider"></div>\n<h2 data-montage-id="dynamicText"></h2>',
        javascript: ""
    },
    {
        label: "Two way Bindings",
        css: "",
        serialization: {
            "number": {
                "prototype": "montage/ui/input-number.reel",
                "properties": {
                    "element": {"#": "number"},
                    "value": 50
                }
            },

            "slider1": {
                "prototype": "montage/ui/bluemoon/slider.reel",
                "properties": {
                    "element": {"#": "slider1"}
                },
                "bindings": {
                    "value": {"<->": "@number.value"}
                }
            },

            "slider2": {
                "prototype": "montage/ui/bluemoon/slider.reel",
                "properties": {
                    "element": {"#": "slider2"}
                },
                "bindings": {
                    "value": {"<->": "@number.value"}
                }
            }
        },
        html: '<input type="number" data-montage-id="number">\n<div data-montage-id="slider1" style="width: 20%"></div>\n<div data-montage-id="slider2"></div>',
        javascript: ""
    },
    {
        label: "Accessing Repetition objects",
        css: "",
        serialization: {
            "repetition": {
                "prototype": "montage/ui/repetition.reel",
                "properties": {
                    "objects": ["Mike", "François", "Afonso", "Heather"],
                    "element": {"#": "repetition"}
                }
            },
            "dynamicText": {
                "prototype": "montage/ui/dynamic-text.reel",
                "properties": {
                    "element": {"#": "dynamicText"}
                },
                "bindings": {
                    "value": {"<-": "@repetition.objectAtCurrentIteration"}
                }
            }
        },
        html: '<ul data-montage-id="repetition">\n  <li>\n    Hello there <span data-montage-id="dynamicText"></span>!\n  </li>\n</ul>',
        javascript: ""
    }
];