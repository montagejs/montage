var Component = require("montage/ui/component").Component,
    Promise = require('montage/core/promise').Promise;

exports.Main = Component.specialize(/** @lends Main# */{

    enterDocument: {
        value: function () {
            this.content = [];

            for (var i = 0; i < 10; i++) {
                this.content.push('item ' + (i + 1));
            }
        }
    }
  
});
