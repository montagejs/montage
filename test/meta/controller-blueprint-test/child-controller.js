/* <copyright>
</copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/controller/object-controller").Component;
var ParentController = require("meta/controller-blueprint-test/parent-controller").ParentController;

var  ChildController = exports.ChildController = Montage.create(ParentController, {

    purchaseList: {
        value: []
   }

});
