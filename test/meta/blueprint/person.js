/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.blueprintForName("Person");

var Person = exports.Person = blueprint.create(Montage, {

    // Token class

});
