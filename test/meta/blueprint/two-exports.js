var Montage = require("montage").Montage;

exports.One = Montage.specialize({
    blueprint: require("montage")._blueprintDescriptor,
    blueprintModuleId: require("montage")._blueprintModuleIdDescriptor,
});

exports.Two = Montage.specialize({
    blueprint: require("montage")._blueprintDescriptor,
    blueprintModuleId: require("montage")._blueprintModuleIdDescriptor,
});
