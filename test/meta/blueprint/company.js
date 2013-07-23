/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
console.warn("FIXME blueprintForPrototype");
var blueprint = binder.blueprints[1];//binder.blueprintForPrototype("Company", "meta/blueprint/company");

var Company = exports.Company = blueprint.create(Montage, {

    // Token class

});
