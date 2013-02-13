/* <copyright>
 </copyright> */
var Montage = require("montage").Montage;
var TestPageLoader = require("support/testpageloader").TestPageLoader;
var Component = require("montage/ui/component").Component;
var Selector = require("montage/core/selector").Selector;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;
var Promise = require("montage/core/promise").Promise;
var Serializer = require("montage/core/serialization").Serializer;

var testPage = TestPageLoader.queueTest("component-blueprint-test", function () {
    describe("meta/component-blueprint-spec", function () {
        it("should load", function () {
            expect(testPage.loaded).toBeTruthy();
        });

        var component1;
        var component2;
        var component3;
        var button;
        var inputrange;
        var toggle;
        var checkbox;
        var inputtext;
        var dynamictext;


        beforeEach(function () {
            console.log("CLEAR!")
            component1 = testPage.test.component1;
            component2 = testPage.test.component2;
            component3 = testPage.test.component3;
            button = testPage.test.button;
            inputrange = testPage.test.inputrange;
            toggle = testPage.test.toggle;
            checkbox = testPage.test.checkbox;
            inputtext = testPage.test.inputtext;
            dynamictext = testPage.test.dynamictext;
        });

        it("can create new blueprint", function () {
            var newBlueprint = Blueprint.create().initWithName(component1.identifier);
            expect(newBlueprint).toBeTruthy();
            component1.blueprint = newBlueprint;
            var blueprintPromise = component1.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });

        it("can create new property blueprint", function () {
            var newBlueprint = Blueprint.create().initWithName(component1.identifier);
            expect(newBlueprint).toBeTruthy();
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty");
            component1.blueprint = newBlueprint;
            var blueprintPromise = component1.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).not.toBeNull();
            });
        });

        it("can serialize the component blueprint", function () {
            var serializer = Serializer.create().initWithRequire(require);

            var newBlueprint = Blueprint.create().initWithName(component1.identifier);
            expect(newBlueprint).toBeTruthy();
            //
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty1");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty2");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty3");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty4");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty5");
            //
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.addToOnePropertyBlueprintNamed("requiredBindableProperty1"), "required");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.addToOnePropertyBlueprintNamed("requiredBindableProperty2"), "required");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.addToOnePropertyBlueprintNamed("requiredBindableProperty3"), "required");
            component1.blueprint = newBlueprint;

            var blueprintPromise = component1.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                var serializedDescription = serializer.serializeObject(blueprint);
                expect(serializedDescription).toBeTruthy();
                console.log(serializedDescription);
            });
        });

        it("can load the component blueprint from the reel", function () {
            var blueprintPromise = component2.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                expect(blueprint.propertyBlueprintForName("bindableProperty1")).toBeTruthy();
                expect(blueprint.propertyBlueprintGroupForName("required")).toBeTruthy();
            });
        });

        it("can create button blueprint", function () {
            var serializer = Serializer.create().initWithRequire(require);

            var newBlueprint = Blueprint.create().initWithName(button.identifier);
            expect(newBlueprint).toBeTruthy();
            //
            var autofocus = newBlueprint.addToOnePropertyBlueprintNamed("autofocus");
            autofocus.valueType = "string";
            autofocus.helpString = "Specifies that a button should automatically get focus when the page loads";

            var enabled = newBlueprint.addToOnePropertyBlueprintNamed("enabled");
            enabled.valueType = "boolean";
            enabled.helpString = "Specifies that a button should be enabled";

            var form = newBlueprint.addToOnePropertyBlueprintNamed("form");
            form.valueType = "string";
            form.helpString = "Specifies one or more forms the button belongs to";

            var formaction = newBlueprint.addToOnePropertyBlueprintNamed("formaction");
            formaction.valueType = "url";
            formaction.helpString = "Specifies where to send the form-data when a form is submitted. Only for type='submit'";

            var formenctype = newBlueprint.addToOnePropertyBlueprintNamed("formenctype");
            formenctype.valueType = "enum";
            formenctype.enumValues = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
            formenctype.helpString = "Specifies how form-data should be encoded before sending it to a server. Only for type='submit'";

            var formmethod = newBlueprint.addToOnePropertyBlueprintNamed("formmethod");
            formmethod.valueType = "enum";
            formmethod.enumValues = ["get", "post"];
            formmethod.helpString = "Specifies how to send the form-data (which HTTP method to use). Only for type='submit'";

            var formnovalidate = newBlueprint.addToOnePropertyBlueprintNamed("formnovalidate");
            formnovalidate.valueType = "boolean";
            formnovalidate.helpString = "Specifies that the form-data should not be validated on submission. Only for type='submit'";

            var formtarget = newBlueprint.addToOnePropertyBlueprintNamed("formtarget");
            formtarget.valueType = "string";
            formtarget.helpString = "Specifies where to display the response after submitting the form. Only for type='submit'";

            var name = newBlueprint.addToOnePropertyBlueprintNamed("name");
            name.valueType = "string";
            name.helpString = "Specifies a name for the button";

            var label = newBlueprint.addToOnePropertyBlueprintNamed("label");
            label.valueType = "string";
            label.helpString = "";

            var type = newBlueprint.addToOnePropertyBlueprintNamed("type");
            type.valueType = "enum";
            type.enumValues = ["button", "reset", "submit"];
            type.helpString = "Specifies the type of button";

            var value = newBlueprint.addToOnePropertyBlueprintNamed("value");
            value.valueType = "string";
            value.helpString = "Specifies an initial value for the button";
            //
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("label"), "base");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("type"), "base");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("name"), "base");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("enabled"), "base");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("autofocus"), "base");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("form"), "form");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("formaction"), "form");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("formenctype"), "form");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("formmethod"), "form");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("formnovalidate"), "form");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.propertyBlueprintForName("formtarget"), "form");
            button.blueprint = newBlueprint;

            var blueprintPromise = button.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                var serializedDescription = serializer.serializeObject(blueprint);
                expect(serializedDescription).toBeTruthy();
                console.log(serializedDescription);
            });
        });

        it("can create validation rules", function () {
            var serializer = Serializer.create().initWithRequire(require);

            var newBlueprint = Blueprint.create().initWithName(component3.identifier);
            expect(newBlueprint).toBeTruthy();
            //
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty1");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty2");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty3");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty4");
            newBlueprint.addToOnePropertyBlueprintNamed("bindableProperty5");
            //
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.addToOnePropertyBlueprintNamed("requiredBindableProperty1"), "required");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.addToOnePropertyBlueprintNamed("requiredBindableProperty2"), "required");
            newBlueprint.addPropertyBlueprintToGroupNamed(newBlueprint.addToOnePropertyBlueprintNamed("requiredBindableProperty3"), "required");

            newBlueprint.addPropertyValidationRule("rule1").validationSelector = null;
            //            newBlueprint.addPropertyValidationRule("rule1").validationSelector = Selector.property("requiredBindableProperty1").isBound;
            //            newBlueprint.addPropertyValidationRule("rule2").validationSelector = Selector.property("requiredBindableProperty2").isBound;
            //            newBlueprint.addPropertyValidationRule("rule3").validationSelector = Selector.property("requiredBindableProperty3").isBound;

            component3.blueprint = newBlueprint;

            var blueprintPromise = component3.blueprint;
            return blueprintPromise.then(function (blueprint) {
                expect(blueprint).toBeTruthy();
                var serializedDescription = serializer.serializeObject(blueprint);
                expect(serializedDescription).toBeTruthy();
            });
        });


    });
});
