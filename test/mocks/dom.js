Set = require("montage/collections/set");

exports.element = function () {
    return {
        classList: {
            add: function (className) {
                this.__classList__.add.apply(this.__classList__, arguments);
            },
            remove: function (className) {
                this.__classList__.remove.apply(this.__classList__, arguments);
            },
            toggle: function (className) {
                if(this.__classList__.has(className)) {
                    this.__classList__.remove(className);
                } else {
                    this.__classList__.add(className);
                }
            },
            contains: function (className) {
                return this.__classList__.has(className);
            }
        },
        __classList__: new Set(),
        className: "",
        style: {},
        removeAttribute: function () {},
        __attributes__: {},
        setAttribute: function (attribute, value) {
            this.__attributes__[attribute] = value;
        },
        getAttribute: function (attribute) {
            return this.__attributes__[attribute] || "";
        },
        hasAttribute: function (attribute) {
            return attribute in this.__attributes__;
        },
        focus: function () {},
        blur: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        tagName: "MOCK"
    };
}
