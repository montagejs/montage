var applicationExports = require("core/application"),
    Application = applicationExports.Application,
    MontageReviver = require("core/serialization/deserializer/montage-reviver").MontageReviver;





exports.WorkerApplication = Application.specialize({

    _load: {
        value: function (applicationRequire, callback) {
            var self = this,
                mainModule = applicationRequire.packageDescription.mainWorkerModule,
                mainLocation, mainModulePromise;

            this.name = applicationRequire.packageDescription.name;
            applicationExports.application = exports.application = this;

            if (mainModule) {
                mainLocation = MontageReviver.parseObjectLocationId(mainModule);
                mainModulePromise = applicationRequire.async(mainLocation.moduleId);
            } else {
                mainModulePromise = Promise.resolve(null);
            }

            return mainModulePromise.then(function (exports) {
                if (exports) {
                    self.mainComponent = new exports[mainLocation.objectName]();
                }
                if (callback) {
                    callback(self);
                }
                return self;
            });
        }
    }

});
