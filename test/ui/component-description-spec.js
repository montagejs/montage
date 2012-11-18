/* <copyright>
</copyright> */
var Montage = require("montage").Montage;
var TestPageLoader = require("support/testpageloader").TestPageLoader;
var Component = require("montage/ui/component").Component;
var Selector = require("montage/core/selector").Selector;
var ComponentDescription = require("montage/ui/component-description").ComponentDescription;
var Serializer = require("montage/core/serializer").Serializer;

var testPage = TestPageLoader.queueTest("component-description-test", function() {
    describe("ui/component-description-spec", function() {
        it("should load", function() {
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


        beforeEach(function() {
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

        it("can create new description", function() {
            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            component1.description = newComponentDescription;
            var descriptionPromise = component1.description;
            return descriptionPromise.then(function (description) {
                expect(description).not.toBeNull();
            });
        });

        it("can create new property description", function() {
            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            newComponentDescription.addComponentPropertyDescription("bindableProperty");
            component1.description = newComponentDescription;
            var descriptionPromise = component1.description;
            return descriptionPromise.then(function (description) {
                expect(description).not.toBeNull();
            });
        });

        it("can serialize the component description", function() {
            var serializer = Serializer.create().initWithRequire(require);

            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            //
            newComponentDescription.addComponentPropertyDescription("bindableProperty1");
            newComponentDescription.addComponentPropertyDescription("bindableProperty2");
            newComponentDescription.addComponentPropertyDescription("bindableProperty3");
            newComponentDescription.addComponentPropertyDescription("bindableProperty4");
            newComponentDescription.addComponentPropertyDescription("bindableProperty5");
            //
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty1", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty2", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty3", "required");
            component1.description = newComponentDescription;

            var descriptionPromise = component1.description;
            return descriptionPromise.then(function (description) {
                expect(description).toBeTruthy();
                var serializedDescription = serializer.serializeObject(description);
                expect(serializedDescription).toBeTruthy();
             });
        });

        it("can load the component description from the reel", function() {
            var descriptionPromise = component2.description;
            return descriptionPromise.then(function (description) {
                expect(description).toBeTruthy();
                expect(description.componentPropertyDescriptionForName("bindableProperty1")).toBeTruthy();
                expect(description.componentPropertyDescriptionGroupForName("required")).toBeTruthy();
             });
        });

        it("can create button description", function() {
            var serializer = Serializer.create().initWithRequire(require);

            var newComponentDescription = ComponentDescription.create().initWithComponent(button);
            expect(newComponentDescription).toBeTruthy();
            //
            var autofocus = newComponentDescription.addComponentPropertyDescription("autofocus");
            autofocus.valueType = "string";
            autofocus.helpString = "Specifies that a button should automatically get focus when the page loads";

            var enabled = newComponentDescription.addComponentPropertyDescription("enabled");
            enabled.valueType = "boolean";
            enabled.helpString = "Specifies that a button should be enabled";

            var form = newComponentDescription.addComponentPropertyDescription("form");
            form.valueType = "string";
            form.helpString = "Specifies one or more forms the button belongs to";

            var formaction = newComponentDescription.addComponentPropertyDescription("formaction");
            formaction.valueType = "url";
            formaction.helpString = "Specifies where to send the form-data when a form is submitted. Only for type='submit'";

            var formenctype = newComponentDescription.addComponentPropertyDescription("formenctype");
            formenctype.valueType = "enum";
            formenctype.enumValues = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
            formenctype.helpString = "Specifies how form-data should be encoded before sending it to a server. Only for type='submit'";

            var formmethod = newComponentDescription.addComponentPropertyDescription("formmethod");
            formmethod.valueType = "enum";
            formmethod.enumValues = ["get", "post"];
            formmethod.helpString = "Specifies how to send the form-data (which HTTP method to use). Only for type='submit'";

            var formnovalidate = newComponentDescription.addComponentPropertyDescription("formnovalidate");
            formnovalidate.valueType = "boolean";
            formnovalidate.helpString = "Specifies that the form-data should not be validated on submission. Only for type='submit'";

            var formtarget = newComponentDescription.addComponentPropertyDescription("formtarget");
            formtarget.valueType = "string";
            formtarget.helpString = "Specifies where to display the response after submitting the form. Only for type='submit'";

            var name = newComponentDescription.addComponentPropertyDescription("name");
            name.valueType = "string";
            name.helpString = "Specifies a name for the button";

            var label = newComponentDescription.addComponentPropertyDescription("label");
            label.valueType = "string";
            label.helpString = "";

            var type = newComponentDescription.addComponentPropertyDescription("type");
            type.valueType = "enum";
            type.enumValues = ["button", "reset", "submit"];
            type.helpString = "Specifies the type of button";

            var value = newComponentDescription.addComponentPropertyDescription("value");
            value.valueType = "string";
            value.helpString = "Specifies an initial value for the button";
            //
            newComponentDescription.addComponentPropertyDescriptionToGroup("label", "base");
            newComponentDescription.addComponentPropertyDescriptionToGroup("type", "base");
            newComponentDescription.addComponentPropertyDescriptionToGroup("name", "base");
            newComponentDescription.addComponentPropertyDescriptionToGroup("enabled", "base");
            newComponentDescription.addComponentPropertyDescriptionToGroup("autofocus", "base");
            newComponentDescription.addComponentPropertyDescriptionToGroup("form", "form");
            newComponentDescription.addComponentPropertyDescriptionToGroup("formaction", "form");
            newComponentDescription.addComponentPropertyDescriptionToGroup("formenctype", "form");
            newComponentDescription.addComponentPropertyDescriptionToGroup("formmethod", "form");
            newComponentDescription.addComponentPropertyDescriptionToGroup("formnovalidate", "form");
            newComponentDescription.addComponentPropertyDescriptionToGroup("formtarget", "form");
            button.description = newComponentDescription;

            var descriptionPromise = button.description;
            return descriptionPromise.then(function (description) {
                expect(description).toBeTruthy();
                var serializedDescription = serializer.serializeObject(description);
                expect(serializedDescription).toBeTruthy();
                console.log(serializedDescription);
             });
        });

        it("can create validation rules", function() {
            var serializer = Serializer.create().initWithRequire(require);

            var newComponentDescription = ComponentDescription.create().initWithComponent(component1);
            expect(newComponentDescription).toBeTruthy();
            //
            newComponentDescription.addComponentPropertyDescription("bindableProperty1");
            newComponentDescription.addComponentPropertyDescription("bindableProperty2");
            newComponentDescription.addComponentPropertyDescription("bindableProperty3");
            newComponentDescription.addComponentPropertyDescription("bindableProperty4");
            newComponentDescription.addComponentPropertyDescription("bindableProperty5");
            //
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty1", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty2", "required");
            newComponentDescription.addComponentPropertyDescriptionToGroup("requiredBindableProperty3", "required");

            newComponentDescription.addComponentPropertyValidationRule("rule1").validationSelector = null;
//            newComponentDescription.addComponentPropertyValidationRule("rule1").validationSelector = Selector.property("requiredBindableProperty1").isBound;
//            newComponentDescription.addComponentPropertyValidationRule("rule2").validationSelector = Selector.property("requiredBindableProperty2").isBound;
//            newComponentDescription.addComponentPropertyValidationRule("rule3").validationSelector = Selector.property("requiredBindableProperty3").isBound;

            component3.description = newComponentDescription;

            var descriptionPromise = component3.description;
            return descriptionPromise.then(function (description) {
                expect(description).toBeTruthy();
                var serializedDescription = serializer.serializeObject(description);
                expect(serializedDescription).toBeTruthy();
             });
        });


    });
});
