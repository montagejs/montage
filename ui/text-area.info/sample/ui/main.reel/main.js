/**
 * @module ui/main.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main.prototype */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },

    handleTitleBar1BackAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar1Description.pushAction("back");
        }
    },

    handleTitleBar1CloseAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar1Description.pushAction("close");
        }
    },

    handleTitleBar2SettingsAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar2Description.pushAction("settings");
        }
    },

    handleTitleBar3BackAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar3Description.pushAction("back");
        }
    },

    handleTitleBar4BackAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar4Description.pushAction("back");
        }
    },

    handleTitleBar4CloseAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar4Description.pushAction("close");
        }
    },

    handleTitleBar5SettingsAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar5Description.pushAction("settings");
        }
    },

    handleTitleBar6BackAction: {
        value: function (event) {
            event.stopPropagation();
            this.templateObjects.titleBar6Description.pushAction("back");
        }
    }
});
