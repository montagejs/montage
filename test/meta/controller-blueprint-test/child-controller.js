/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/core/object-controller").Component;
var ParentController = require("meta/controller-blueprint-test/parent-controller").ParentController;

var  ChildController = exports.ChildController = ParentController.specialize( {

    purchaseList: {
        value: []
   }

});
