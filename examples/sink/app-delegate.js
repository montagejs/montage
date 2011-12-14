var Montage = require("montage").Montage;

exports.AppDelegate = Montage.create(Montage, {


    deserializedFromTemplate: {
        value: function() {
            console.log('app-delegate deserialized');
            console.log(window.location.hash);
        }
    }

});