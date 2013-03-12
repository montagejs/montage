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

    handleClearSelectionButtonAction: {
        value: function (evt) {
            this.clearSelection();
        }
    },

    handleSelectIndex0ButtonAction: {
        value: function (evt) {
            this.selectIndex(0);
        }
    },

    handleSelectIndex2ButtonAction: {
        value: function (evt) {
            this.selectIndex(2);
        }
    },

    handleSelectIndex4ButtonAction: {
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
