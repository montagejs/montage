/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
console.warn("FIXME blueprintForPrototype");
var blueprint = binder.blueprints[0];//binder.blueprintForPrototype("Person", "meta/blueprint/person");

var Person = exports.Person = blueprint.create(Montage, {

    // Token class

});
