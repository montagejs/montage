/**
 * @module ui/menu.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    PressComposer = require("montage/composer/press-composer").PressComposer;

/**
 * A Menu node
 *
 * @class MenuNode
 * @extends Component
 */
exports.MenuNode = Component.specialize(/** @lends MenuNode# */ {
    constructor: {
        value: function MenuNode() {
            this.super();
            this._pressComposer = new PressComposer();
            this.addComposer(this._pressComposer);
        }
    },

    _pressComposer: {
        value: null
    },

    _isExpanded: {
        value: false
    },

    /**
     * Is child menu node expanded or not. The child menu node's isExpanded will be change when change this.
     *
     */
    _isChildExpanded: {
        value: false
    },

    /**
     * Is the menu node expanded or not. When set it to false, also set all children's isExpanded to false.
     *
     */
    isExpanded: {
        set: function (value) {
            // Also collapse all children menu node.
            if (value != this._isExpanded && value == false) {
                this._isChildExpanded = false;
            }
            this._isExpanded = value;
        },
        get: function () {
            return this._isExpanded;
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._pressComposer.addEventListener("press", this, false);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                // if parent element has _isChildExpanded defined, bind to it, otherwise no, no bind for root menu node.
                if (this.parentComponent._isChildExpanded != undefined) {
                    this.defineBinding("isExpanded", {
                        "<->": "parentComponent._isChildExpanded"
                    });
                }
            }
        }
    },

    /**
     * Expand or collapse child menu node when click on a menu node if it has children
     *
     * @method
     * @private
     */
    handlePress: {
        value: function () {
            this._isChildExpanded = !this._isChildExpanded;
            if (this._isChildExpanded == true) {
                this._closeOtherSameLevelMenuNode();
            }
        }
    },

    /**
     * Collapsed all same level menus' sub menus except self.
     *
     * @method
     * @private
     */
    _closeOtherSameLevelMenuNode: {
        value: function () {
            var parentMenuNode = this.parentComponent;
            var len = parentMenuNode.childComponents.length;
            for (var i = 0; i < len; i++) {
                var menuNode = parentMenuNode.childComponents[i];
                if (menuNode != this) {
                    menuNode._isChildExpanded = false;
                }
            }
        }
    }
});
