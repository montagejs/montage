/* <copyright>
s</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
console.warn("FIXME blueprintForPrototype");
var blueprint = binder.blueprints[2];//binder.blueprintForPrototype("Project", "meta/blueprint/project");

var Project = exports.Project = blueprint.create(Montage, {

    // Token class

});
