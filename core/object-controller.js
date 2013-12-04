/**
 * @module montage/core/object-controller
 * @requires montage/core/core
 */

var Montage = require("montage").Montage;

/**
 * @class ObjectController
 * @classdesc Generic object controller.
 * @extends Montage
 */
var ObjectController = exports.ObjectController = Montage.specialize( /** @lends ObjectController# */ {

    constructor: {
        value: function ObjectController() {
            this.super();
        }
    },

    /**
     * @type {Property}
     * @default null
     */
    objectPrototype: {
        enumerable: false,
        value: null
    },

    /**
     * @method
     * @returns new this.objectPrototype()
     */
    newObject: {
        enumerable: false,
        value: function() {
            return new this.objectPrototype();
        }
    },

    /**
     * @method
     * @param {Property} content TODO
     * @returns itself
     */
    initWithContent: {
        value: function(content) {
            this.content = content;
            return this;
        }
    },

    /**
     * @type {Property}
     * @default null
     */
    content: {
        enumerable: false,
        value: null
    },

    blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

    blueprint:require("montage")._blueprintDescriptor

});

