/* <copyright>
</copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Model = require("montage/core/meta/model").Model;

exports.companyBinder = function () {
    return exports.BinderHelper.companyBinder();
};

exports.BinderHelper = Montage.specialize( {
}, {
    companyBinder: {
        value: function () {
            var companyBinder = new Model().initWithNameAndRequire("CompanyBinder", require);

            var personBlueprint = companyBinder.addObjectDescriptorNamed("Person", "spec/meta/blueprint/person");
            personBlueprint.addToOnePropertyDescriptorNamed("name");
            personBlueprint.addToManyPropertyDescriptorNamed("phoneNumbers");

            var companyBlueprint = companyBinder.addObjectDescriptorNamed("Company", "spec/meta/blueprint/company");
            companyBlueprint.addToOnePropertyDescriptorNamed("name");

            companyBlueprint.addToManyAssociationBlueprintNamed("directReports", personBlueprint.addToOneAssociationBlueprintNamed("supervisor"));

            var projectBlueprint = companyBinder.addObjectDescriptorNamed("Project", "spec/meta/blueprint/project");
            projectBlueprint.addToOnePropertyDescriptorNamed("name");
            projectBlueprint.addToOnePropertyDescriptorNamed("startDate");
            projectBlueprint.addToOnePropertyDescriptorNamed("endDate");

            // companyBlueprint.addToManyAssociationBlueprintNamed("projects", personBlueprint.addToOneAssociationBlueprintNamed("company"));
            //
            // personBlueprint.addToManyAssociationBlueprintNamed("projects", projectBlueprint.addToManyAssociationBlueprintNamed("contributors"));

            Model.group.addModel(companyBinder);

            return companyBinder;
        }
    }

});
