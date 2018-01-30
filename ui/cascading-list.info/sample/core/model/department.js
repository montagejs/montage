var MontageModule = require("montage"),
    Montage = MontageModule.Montage,
    objectDescriptorModuleIdDescriptor = MontageModule._objectDescriptorModuleIdDescriptor,
    objectDescriptorDescriptor = MontageModule._objectDescriptorDescriptor;

/**
 * @class Department
 * @extends Montage
 */
exports.Department = Montage.specialize({

    id: {
        value: null
    },

    name: {
        value: null
    }

}, {

    objectDescriptorModuleId: objectDescriptorModuleIdDescriptor,

    objectDescriptor: objectDescriptorDescriptor

});
