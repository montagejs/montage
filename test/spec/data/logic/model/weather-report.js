var Montage = require("montage").Montage,
    ObjectDescriptor = require("montage/core/meta/object-descriptor").ObjectDescriptor,
    ModuleReference = require("montage/core/module-reference").ModuleReference;

exports.WeatherReport = WeatherReport = Montage.specialize(/** @lends AreaBriefReport.prototype */ {
    temp: {
        value: null
    },
    constructor: {
        value: function WeatherReport() {}
    }
}, {

    TYPE: {
        //get: DataObjectDescriptor.getterFor(exports, "WeatherReport"),
        get: function () {
            if (!this._TYPE) {
                var descriptor = new ObjectDescriptor();
                descriptor._name = "WeatherReport";
                descriptor.exportName = "WeatherReport";
                var info = Montage.getInfoForObject(WeatherReport);
                descriptor.module = (new ModuleReference()).initWithIdAndRequire(info.moduleId, info.require);
                descriptor.propertyDescriptors = [];
                descriptor.objectPrototype = WeatherReport;
                this._TYPE = descriptor;
            }

            return this._TYPE;
        }
    }
});
