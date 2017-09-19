/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var ModelHelper = require("spec/meta/blueprint/model-helper").ModelHelper;
var model = ModelHelper.companyModel();
var objectDescriptor = model.objectDescriptorForName("Company");

var Company = exports.Company = objectDescriptor.create(Montage, {

    // Token class

});
