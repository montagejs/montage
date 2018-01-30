var MontageModule = require("montage"),
    Montage = MontageModule.Montage,
    objectDescriptorModuleIdDescriptor = MontageModule._objectDescriptorModuleIdDescriptor,
    objectDescriptorDescriptor = MontageModule._objectDescriptorDescriptor;

/**
 * @class Customer
 * @extends Montage
 */
exports.Customer = Montage.specialize({

    fisrtname: {
        value: null
    },

    lastname: {
        value: null
    }

}, {

    objectDescriptorModuleId: objectDescriptorModuleIdDescriptor,

    objectDescriptor: objectDescriptorDescriptor

});
