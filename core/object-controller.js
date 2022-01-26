/**
 * @module montage/core/object-controller
 * @requires montage/core/core
 */

var core = require("./core"),
    Montage = core.Montage;

/**
 * @class ObjectController
 * @classdesc Generic object controller.
 * @extends Montage
 */
exports.ObjectController = Montage.specialize( /** @lends ObjectController# */ {

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

    objectDescriptorModuleId:core._objectDescriptorModuleIdDescriptor,

    objectDescriptor:core._objectDescriptorDescriptor,

    blueprintModuleId:core._blueprintModuleIdDescriptor,

    blueprint:core._blueprintDescriptor

});

