/* <copyright>
s</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.blueprintForPrototype("Project", "meta/blueprint/project");

var Project = exports.Project = blueprint.create(Montage, {

    // Token class

});
