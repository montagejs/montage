/* <copyright>
</copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var BlueprintBinder = require("montage/core/meta/blueprint").BlueprintBinder;

exports.companyBinder = function () {
    return exports.BinderHelper.companyBinder();
};

exports.BinderHelper = Montage.create(Montage, {

    companyBinder: {
        value: function() {
            var companyBinder = BlueprintBinder.create().initWithName("CompanyBinder");

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

            BlueprintBinder.manager.addBlueprintBinder(companyBinder);

            return companyBinder;
        }
    }

});
