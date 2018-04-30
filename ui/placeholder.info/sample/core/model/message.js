var MontageModule = require("montage"),
    Montage = MontageModule.Montage,
    objectDescriptorModuleIdDescriptor = MontageModule._objectDescriptorModuleIdDescriptor,
    objectDescriptorDescriptor = MontageModule._objectDescriptorDescriptor;

/**
 * @class Message
 * @extends Montage
 */
exports.Message = Montage.specialize({

    id: {
        value: null
    },

    value: {
        value: null
    }

}, {

    objectDescriptorModuleId: objectDescriptorModuleIdDescriptor,

    objectDescriptor: objectDescriptorDescriptor

});
