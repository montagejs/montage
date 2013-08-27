/**
	@module "matte/ui/list.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    observeProperty = require("montage/frb/observers").observeProperty;

/**
 @class module:"matte/ui/list.reel".List
 @extends module:montage/ui/component.Component
 */
var List = exports.List = Component.specialize(/** @lends module:"matte/ui/list.reel".List# */ {
    /**
      Description TODO
      @private
    */
    _repetition: {
        value: null
    },
    /**
        Description TODO
        @type {Property}
        @default null
    */
    delegate: {
        value: null
    },

    _content: {value: null},
    content: {
        set: function(value) {
            this._content = value;
            this.defineBinding("_repetition.content", {
                "<-": "_content"
            });
        },
        get: function() {
            return this._content;
        }
    },

    _contentController: {value: null},
    contentController: {
        set: function(value) {
            this._contentController = value;
            this.defineBinding("_repetition.contentController", {
                "<-": "_contentController"
            });
        },
        get: function() {
            return this._contentController;
        }
    },

    axis: {
        value: null
    },

/**
  Description TODO
  @private
*/
    isSelectionEnabled: {
        value: null
    },

    // Initialization

    // TODO we should probably support the programmatic initialization of a list; forwarding the childComponents
    // along to the repetition
    // I want to say that if somebody knows enough to do that they know enough to append the child components' elements
    // into the repetition, not the list

    observeProperty: {
        value: function (key, emit, scope) {
            if (key === "objectAtCurrentIteration" || key === "currentIteration") {
                if (this._repetition) {
                    return this._repetition.observeProperty(key, emit, scope);
                }
            } else {
                return observeProperty(this, key, emit, scope);
            }
        }
    }

});
