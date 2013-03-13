var Montage = require("montage").Montage;

exports.SubstitutionTest = Montage.create(Montage, {
    templateDidLoad: {
        value: function(documentPart) {
            this.templateObjects = documentPart.objects;
        }
    }
});
