/**
	@module montage/ui/condition.reel
    @requires montage/core/core
    @requires montage/ui/component
    @requires "montage/ui/slot.reel"
    @requires montage/core/logger
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    logger = require("core/logger").logger("condition");
/**
 @class Condition
 @extends Component
 */

exports.Condition = Component.specialize( /** @lends Condition# */ {

/**
    The Condition component does not have an HTML template, so this value is set to false.
    @type {Property}
    @default {Boolean} false
*/
    hasTemplate: {
        value: false
    },
/**
  @private
*/
    _condition: {
        value: true
    },

    _contents: {
        value: null
    },

    constructor: {
        value: function Condition() {
            this.super();
        }
    },

/**
        @type {Function}
        @default null
    */
    condition: {
        set: function(value) {

            if (value === this._condition) {
                return;
            }

            this._condition = value;
            this.needsDraw = true;
            // If it is being deserialized element might not been set yet
            if (!this.isDeserializing) {
                this._updateDomContent(value);
            }
        },
        get: function() {
            return this._condition;
        }
    },

    _updateDomContent: {
        value: function(value) {
            if (this.removalStrategy === "remove") {
                if (value) {
                    this.domContent = this._contents;
                } else {
                    this._contents = this.domContent;
                    this.domContent = null;
                }
            }
        }
    },

    deserializedFromTemplate: {
        value: function() {
            // update the DOM if the condition is false because we're preventing
            // changes at deserialization time.
            if (!this._condition) {
                this._updateDomContent(this._condition);
            }
        }
    },

    /**
     @private
     */
    _removalStrategy:{
        value: "remove"
    },

    // TODO should this strategy be part of another class?
    // TODO expose the options as an exported enum
    removalStrategy:{
        get:function () {
            return this._removalStrategy;
        },
        set:function (value) {
            var contents;

            if (this._removalStrategy === value) {
                return;
            }
            if (value === "hide" && !this.isDeserializing) {
                contents = this.domContent;
                this.domContent = this._contents;
                this._contents = contents;
            }
            this._removalStrategy = value;
            this.needsDraw = true;
        }
    },

    /**
    @function
    */
    draw: {
        value: function() {

            if (this.condition) {
                this.element.classList.remove("montage-invisible");
            } else {
                this.element.classList.add("montage-invisible");
            }

        }
    }

});
