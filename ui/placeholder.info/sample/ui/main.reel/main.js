var Component = require("montage/ui/component").Component,
    Message = require("core/model/message").Message;    

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.message = new Message();
            this.message.value = 'Bonjour';

            this.message2 = new Message();
            this.message2.value = 'Holà';
        }
    }
  
});
