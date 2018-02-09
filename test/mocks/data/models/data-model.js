var MontageModule = require("montage"),
    Montage = MontageModule.Montage,
    objectDescriptorModuleIdDescriptor = MontageModule._objectDescriptorModuleIdDescriptor,
    objectDescriptorDescriptor = MontageModule._objectDescriptorDescriptor;

/**
 * @class DataModel
 * @extends Montage
 */
exports.DataModel = Montage.specialize({

    _id: {
        value: null
    },

    id: {
        get: function () {
            return this._id || (this._id = this.constructor.generateId());
        }
    },

}, {
    
    _lastId: {
        value: 0
    },

    generateId: {
        value: function () {
            return this._lastId++;
        }
    },

    objectDescriptorModuleId: objectDescriptorModuleIdDescriptor,

    objectDescriptor: objectDescriptorDescriptor

});
