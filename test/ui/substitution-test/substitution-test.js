var Montage = require("montage").Montage;
var TestController = require("montage-testing/test-controller").TestController;

exports.SubstitutionTest = Montage.create(TestController, {
    templateDidLoad: {
        value: function(documentPart) {
            this.templateObjects = documentPart.objects;
        }
    }
});
