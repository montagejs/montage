/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.blueprintForPrototype("Company", "meta/blueprint/company");

var Company = exports.Company = blueprint.create(Montage, {

    // Token class

});
