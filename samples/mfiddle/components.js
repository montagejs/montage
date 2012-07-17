exports.components = [
    {
        label: "Button", name: "button", x: 0, y: -76,
        serialization: {
            "prototype": "montage/ui/bluemoon/button.reel",
            "properties": {
                "value": "Button",
                "enabled": true
            }
        },
        html: '<div data-montage-id="" class="text"></div>'
    },
    {
        label: "TextField", name: "textfield", x: -71, y: -101,
        serialization: {
            "prototype": "montage/ui/bluemoon/textfield.reel",
            "properties": {
                "value": "Editable text"
            }
        },
        html: '<input data-montage-id="" type="text">'
    },
    {
        label: "Checkbox", name: "checkbox", x: -89, y: -76,
        serialization: {
            "prototype": "montage/ui/bluemoon/checkbox.reel",
            "properties": {
                "checked": true
            }
        },
        html: '<div data-montage-id=""></div>'
    },
    {
        label: "Toggle", name: "toggle", x: 0, y: -99,
        serialization: {
            "prototype": "montage/ui/bluemoon/toggle.reel",
            "properties": {
                "value": true
            }
        },
        html: '<div data-montage-id=""></div>'
    },
    {
        label: "Slider", name: "slider", x: -45, y: -76,
        serialization: {
            "prototype": "montage/ui/bluemoon/slider.reel",
            "properties": {
                "minValue": 0,
                "maxValue": 100,
                "value": 50
            }
        },
        html: '<div data-montage-id=""></div>'
    },
    {
        label: "DynamicText", name: "dynamicText", x: 0, y: -122,
        serialization: {
            "prototype": "montage/ui/dynamic-text.reel",
            "properties": {
                "value": "Text"
            }
        },
        html: '<p data-montage-id=""></p>'
    },
    {
        label: "Repetition", name: "repetition", x: -29, y: -125,
        serialization: {
            "prototype": "montage/ui/repetition.reel",
            "properties": {
                "objects": [1, 2, 3]
            }
        },
        html: '<ul data-montage-id=""><li>Item</li></ul>'
    }
];

