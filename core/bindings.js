// logs: montage/core/bindings is deprecated, use montage/core/core instead.
require("./deprecate").deprecationWarning("montage/core/bindings", "montage/core/core");

exports.Bindings = require("frb");
