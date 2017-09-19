/* <copyright>
</copyright> */
var Montage = require("montage").Montage;
var Model = require("montage/core/meta/model").Model;

exports.companyModel = function () {
    return exports.ModelHelper.companyModel();
};

exports.ModelHelper = Montage.specialize( {
}, {
    companyModel: {
        value: function () {
            var companyModel = new Model().initWithNameAndRequire("CompanyModel", require);

            var personObjectDescriptor = companyModel.addObjectDescriptorNamed("Person", "spec/meta/blueprint/person");
            personObjectDescriptor.addToOnePropertyDescriptorNamed("name");
            personObjectDescriptor.addToManyPropertyDescriptorNamed("phoneNumbers");

            var companyObjectDescriptor = companyModel.addObjectDescriptorNamed("Company", "spec/meta/blueprint/company");
            companyObjectDescriptor.addToOnePropertyDescriptorNamed("name");

            companyObjectDescriptor.addToManyPropertyDescriptorNamed("directReports", personObjectDescriptor.addToOnePropertyDescriptorNamed("supervisor"));

            var projectObjectDescriptor = companyModel.addObjectDescriptorNamed("Project", "spec/meta/blueprint/project");
            projectObjectDescriptor.addToOnePropertyDescriptorNamed("name");
            projectObjectDescriptor.addToOnePropertyDescriptorNamed("startDate");
            projectObjectDescriptor.addToOnePropertyDescriptorNamed("endDate");

            Model.group.addModel(companyModel);

            return companyModel;
        }
    }

});
