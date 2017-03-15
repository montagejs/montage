/* <copyright>
</copyright> */
var Montage = require("montage").Montage;

var BinderHelper = require("spec/meta/blueprint/binderhelper").BinderHelper;
var binder = BinderHelper.companyBinder();
var blueprint = binder.objectDescriptorForName("Person");

var Person = exports.Person = blueprint.create(Montage, {

    // Token class

});
