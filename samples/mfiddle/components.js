exports.components = [
    {
        label: "Button", name: "button",
        x: 0, y: -76, left: 11,
        serialization: {
            "prototype": "montage/ui/button.reel",
            "properties": {
                "label": "Button",
                "enabled": true
            }
        },
        html: '<button data-montage-id=""></button>'
    },
    {
        label: "Range", name: "range",
        x: -45, y: -76, width: 43, left: 13,
        serialization: {
            "prototype": "montage/ui/input-range.reel",
            "properties": {
                "minValue": 0,
                "maxValue": 100,
                "value": 50
            }
        },
        html: '<input type="range" data-montage-id="">'
    },
    {
        label: "Toggle", name: "toggle",
        x: 0, y: -99, left: 12,
        serialization: {
            "prototype": "montage/ui/toggle-button.reel",
            "properties": {
                "value": true,
                "pressedLabel": "On",
                "unpressedLabel": "Off"
            }
        },
        html: '<button data-montage-id=""></button>'
    },
    {
        label: "Checkbox", name: "checkbox",
        x: -89, y: -76, left: 22, width: 24,
        serialization: {
            "prototype": "montage/ui/input-checkbox.reel",
            "properties": {
                "checked": true
            }
        },
        html: '<input type="checkbox" data-montage-id="">'
    },
    {
        label: "InputText", name: "inputText",
        x: -71, y: -101, left: 19,
        serialization: {
            "prototype": "montage/ui/input-text.reel",
            "properties": {
                "value": "Editable text"
            }
        },
        html: '<input data-montage-id="" type="text">'
    },
    {
        label: "DynamicText", name: "dynamicText",
        x: 0, y: -122, left: 20, width: 28,
        serialization: {
            "prototype": "montage/ui/dynamic-text.reel",
            "properties": {
                "value": "Text"
            }
        },
        html: '<p data-montage-id=""></p>'
    },
    {
        label: "Repetition", name: "repetition",
        x: -29, y: -125, left: 19, width: 30,
        serialization: {
            "prototype": "montage/ui/repetition.reel",
            "properties": {
                "objects": [1, 2, 3]
            }
        },
        html: '<ul data-montage-id=""><li>Item</li></ul>'
    }
];

