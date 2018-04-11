var MontageModule = require("montage"),
    Montage = MontageModule.Montage,
    objectDescriptorModuleIdDescriptor = MontageModule._objectDescriptorModuleIdDescriptor,
    objectDescriptorDescriptor = MontageModule._objectDescriptorDescriptor;

/**
 * @class Employee
 * @extends Montage
 */
exports.Employee = Montage.specialize({

    fisrtname: {
        value: null
    },

    lastname: {
        value: null
    },

    departement: {
        value: null
    }

}, {

    objectDescriptorModuleId: objectDescriptorModuleIdDescriptor,

    objectDescriptor: objectDescriptorDescriptor

});
