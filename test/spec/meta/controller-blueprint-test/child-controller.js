/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/core/object-controller").Component;
var ParentController = require("spec/meta/controller-blueprint-test/parent-controller").ParentController;

var  ChildController = exports.ChildController = ParentController.specialize( {

    purchaseList: {
        value: []
   }

});
