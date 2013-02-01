/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    ObjectController = require("montage/ui/controller/object-controller").ObjectController;

var  TestController = exports.TestController = Montage.create(ObjectController, {

    init: {
      value: function() {
          return this;
      }
    },

    customerList: {
        value: []
   },

    customerSelectionList: {
        value: []
    }

});
