var Montage = require("montage").Montage;
var TestController = require("montage-testing/test-controller").TestController;

exports.SubstitutionTest = TestController.specialize( {
    templateDidLoad: {
        value: function (documentPart) {
            this.templateObjects = documentPart.objects;
        }
    }
});
