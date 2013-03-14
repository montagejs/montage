var Montage = require("montage").Montage;

exports.SelectionTest = Montage.create(Montage, {

    nameController: {
        value: null
    },

    content: {
        value: null
    },

    didCreate: {
        value: function () {
            this.content = ["Alice", "Bob", "Carol", "Dave", "Eve"];
        }
    },

    handleClearSelectionButtonPress: {
        value: function (evt) {
            this.clearSelection();
        }
    },

    handleSelectIndex0ButtonPress: {
        value: function (evt) {
            this.selectIndex(0);
        }
    },

    handleSelectIndex2ButtonPress: {
        value: function (evt) {
            this.selectIndex(2);
        }
    },

    handleSelectIndex4ButtonPress: {
        value: function (evt) {
            this.selectIndex(4);
        }
    },

    clearSelection: {
        value: function () {
            this.nameController.selection = [];
        }
    },

    selectIndex: {
        value: function (index) {
            this.nameController.selection = [this.content[index]];
        }
    }
});
