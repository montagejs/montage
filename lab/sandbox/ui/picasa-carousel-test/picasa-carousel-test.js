var Montage = require("montage").Montage;

exports.PicasaCarouselTest = Montage.create(Montage, {

    picasa: {
        value: null
    },

    templateDidLoad: {
        value: function () {
            this.picasa.queryParameter = "flower";
        }
    }

});