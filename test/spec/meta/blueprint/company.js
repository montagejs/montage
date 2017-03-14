/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("spec/meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.blueprintForName("Company");

var Company = exports.Company = blueprint.create(Montage, {

    // Token class

});
