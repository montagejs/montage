var Montage = require("montage").Montage;

exports.PicasaCarouselTest = Montage.create(Montage, {

    picasa: {
        serializable: true,
        value: null
    },

    templateDidLoad: {
        value: function () {
            this.picasa.queryParameter = "flower";
        }
    }

});