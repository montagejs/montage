var Component = require("montage/ui/component").Component,
    Promise = require('montage/core/promise');

exports.Main = Component.specialize(/** @lends Main# */{

   
    handleArchiveAction: {
        value: function () {
            console.log("archive")
            this.listItem.close();
        }
    },

    handleDeleteAction: {
        value: function () {
            console.log("delete")
            this.listItem.close();
        }
    }

});
