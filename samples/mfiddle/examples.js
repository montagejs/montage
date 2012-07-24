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
                "prototype": "montage/ui/button.reel",
                "properties": {
                    "element": {"#": "button"},
                    "label": "Click Me!"
                }
            }
        },
        html: '<button data-montage-id="button"></button>',
        javascript: ""
    },
    {
        label: "A simple Binding",
        css: ".range {\n    width: 100%;\n}",
        serialization: {
            "range": {
                "prototype": "montage/ui/input-range.reel",
                "properties": {
                    "element": {"#": "range"},
                    "value": 50
                }
            },

            "dynamicText": {
                "prototype": "montage/ui/dynamic-text.reel",
                "properties": {
                    "element": {"#": "dynamicText"}
                },
                "bindings": {
                    "value": {"<-": "@range.value"}
                }
            }
        },
        html: '<input type="range" data-montage-id="range" class="range">\n<h2 data-montage-id="dynamicText"></h2>',
        javascript: ""
    },
    {
        label: "Two way Bindings",
        css: ".range2 {\n    width: 100%;\n}",
        serialization: {
            "number": {
                "prototype": "montage/ui/input-number.reel",
                "properties": {
                    "element": {"#": "number"},
                    "value": 50
                }
            },

            "range1": {
                "prototype": "montage/ui/input-range.reel",
                "properties": {
                    "element": {"#": "range1"}
                },
                "bindings": {
                    "value": {"<->": "@number.value"}
                }
            },

            "range2": {
                "prototype": "montage/ui/input-range.reel",
                "properties": {
                    "element": {"#": "range2"}
                },
                "bindings": {
                    "value": {"<->": "@number.value"}
                }
            }
        },
        html: '<input type="number" data-montage-id="number">\n<input type="range" data-montage-id="range1" class="range1">\n<input type="range" data-montage-id="range2" class="range2">',
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