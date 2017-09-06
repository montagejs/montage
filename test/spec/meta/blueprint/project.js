/* <copyright>
s</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("spec/meta/blueprint/modelhelper").BinderHelper;
var model = BinderHelper.companyModel();
var objectDescriptor = model.objectDescriptorForName("Project");

var Project = exports.Project = objectDescriptor.create(Montage, {

    // Token class

});
