var Montage = require("montage/core/core").Montage;

// This file is about to become a JSON configuration file
DefaultEffectRepository = exports.DefaultEffectRepository = Montage.create(Montage, {

    templates: {
        enumerable: true,
        get: function() {
            var templateList = { 
// Nothing for now, below was just a test
//                "Swirl":"default-effect-repository/swirl.html"
            };

			Object.defineProperty(templateList, "__builtin_templates", { writable:true, value: true });

			return templateList;
        }
    },

});
