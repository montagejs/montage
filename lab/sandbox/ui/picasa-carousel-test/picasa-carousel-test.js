var Montage = require("montage").Montage;

exports.PicasaCarouselTest = Montage.create(Montage, {

    templateDidLoad: {
        value: function () {
            this.picasa.queryParameter = "flower";
        }
    }

});