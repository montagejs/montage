/* <copyright>
</copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Binder = require("montage/core/meta/binder").Binder;

exports.companyBinder = function () {
    return exports.BinderHelper.companyBinder();
};

exports.BinderHelper = Montage.specialize( {
}, {
    companyBinder: {
        value: function () {
            var companyBinder = new Binder().initWithNameAndRequire("CompanyBinder", self.mr);

            var personBlueprint = companyBinder.addBlueprintNamed("Person", "meta/blueprint/person");
            personBlueprint.addToOnePropertyBlueprintNamed("name");
            personBlueprint.addToManyPropertyBlueprintNamed("phoneNumbers");

            var companyBlueprint = companyBinder.addBlueprintNamed("Company", "meta/blueprint/company");
            companyBlueprint.addToOnePropertyBlueprintNamed("name");

            companyBlueprint.addToManyAssociationBlueprintNamed("directReports", personBlueprint.addToOneAssociationBlueprintNamed("supervisor"));

            var projectBlueprint = companyBinder.addBlueprintNamed("Project", "meta/blueprint/project");
            projectBlueprint.addToOnePropertyBlueprintNamed("name");
            projectBlueprint.addToOnePropertyBlueprintNamed("startDate");
            projectBlueprint.addToOnePropertyBlueprintNamed("endDate");

            companyBlueprint.addToManyAssociationBlueprintNamed("projects", personBlueprint.addToOneAssociationBlueprintNamed("company"));

            personBlueprint.addToManyAssociationBlueprintNamed("projects", projectBlueprint.addToManyAssociationBlueprintNamed("contributors"));

            Binder.manager.addBinder(companyBinder);

            return companyBinder;
        }
    }

});
