/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var ModelHelper = require("spec/meta/blueprint/model-helper").ModelHelper;
var model = ModelHelper.companyModel();
var objectDescriptor = model.objectDescriptorForName("Person");

var Person = exports.Person = objectDescriptor.create(Montage, {

    // Token class

});
