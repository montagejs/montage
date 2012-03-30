/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Blueprint = require("montage/data/blueprint").Blueprint;
var BlueprintBinder = require("montage/data/blueprint").BlueprintBinder;
var logger = require("montage/core/logger").logger("CompanyBinder");

exports.BinderHelper = Montage.create(Montage, {

    companyBinder: {
        value: function() {
            var companyBinder = BlueprintBinder.create().initWithName("CompanyBinder");
            var personBlueprint = companyBinder.addBlueprintNamed("Person", "data/object/person");
            personBlueprint.addToOneAttributeNamed("name");
            personBlueprint.addToManyAttributeNamed("phoneNumbers");

            var companyBlueprint = companyBinder.addBlueprintNamed("Company", "data/object/company");
            companyBlueprint.addToOneAttributeNamed("name");

            companyBlueprint.addToManyAssociationNamed("employees", personBlueprint.addToOneAssociationNamed("employer"));

            var projectBlueprint = companyBinder.addBlueprintNamed("Project", "data/object/project");
            projectBlueprint.addToOneAttributeNamed("name");
            projectBlueprint.addToOneAttributeNamed("startDate");
            projectBlueprint.addToOneAttributeNamed("endDate");

            companyBlueprint.addToManyAssociationNamed("projects", personBlueprint.addToOneAssociationNamed("company"));

            personBlueprint.addToManyAssociationNamed("projects", projectBlueprint.addToManyAssociationNamed("employees"));

            return companyBinder;
        }
    }

});
