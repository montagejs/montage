/**
 * @module ui/mescription.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Description
 * @extends Component
 */
exports.Description = Component.specialize(/** @lends Description.prototype */ {
    constructor: {
        value: function Description() {
            this.super();
        }
    },

    name: {
        value: null
    },

    size: {
        value: null
    },

    color: {
        value: null
    },

    elements: {
        value: []
    },

    _actions: {
        value: false
    },

    pushAction: {
        value: function (action) {
            this._actions = this._actions || [];
            this._actions.push(action);
            this.element.parentElement.scrollTop = this.element.parentElement.scrollHeight
        }
    }
});
