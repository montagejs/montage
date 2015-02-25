/**
 * @module montage/core/object-controller
 * @requires montage/core/core
 */

var Montage = require("./core").Montage;

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
     * @function
     * @returns new this.objectPrototype()
     */
    newObject: {
        enumerable: false,
        value: function () {
            return new this.objectPrototype();
        }
    },

    /**
     * @function
     * @param {Property} content TODO
     * @returns itself
     */
    initWithContent: {
        value: function (content) {
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

    blueprintModuleId:require("./core")._blueprintModuleIdDescriptor,

    blueprint:require("./core")._blueprintDescriptor

});

