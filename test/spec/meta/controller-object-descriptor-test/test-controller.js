/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    ObjectController = require("montage/core/object-controller").ObjectController;

var  TestController = exports.TestController = ObjectController.specialize( {

    init: {
      value: function () {
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
