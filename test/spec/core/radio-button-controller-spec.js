
var Montage = require("montage").Montage,
    RadioButtonController = require("montage/core/radio-button-controller").RadioButtonController,
    AbstractRadioButton = require("montage/ui/base/abstract-radio-button").AbstractRadioButton;

describe("core/radio-button-controller-spec", function () {
    var InputRadio = AbstractRadioButton.specialize( {}),
        inputRadios = new Array(3),
        controller;

    beforeEach(function () {
        controller = new RadioButtonController();
        controller.content = ["Germany", "Canada", "Spain"];

        controller.content.forEach(function (country, index) {
            inputRadios[index] = new InputRadio();
            inputRadios[index].value = country;
        });
    });

    it("should reflect the value of the controller in the checked property of all checkboxes sharing the same controller", function () {
        for (var i = 0; i < inputRadios.length; i++) {
            inputRadios[i].radioButtonController = controller;
            inputRadios[i].checked = false;
        }
        inputRadios[0].checked = true;

        controller.value = inputRadios[1].value;

        expect(inputRadios[0].checked).toBe(false);
        expect(inputRadios[1].checked).toBe(true);
        expect(inputRadios[2].checked).toBe(false);
    });

    it("should change the controller value when checked radio button changes", function () {
        for (var i = 0; i < inputRadios.length; i++) {
            inputRadios[i].radioButtonController = controller;
            inputRadios[i].checked = false;
        }
        inputRadios[0].checked = true;

        inputRadios[1].checked = true;

        expect(controller.value).toBe(inputRadios[1].value);
    });

    it("should reavaluate the checked checkbox when a new checkbox is registered", function () {
        inputRadios[0].checked = false;
        inputRadios[0].radioButtonController = controller;

        controller.value = "Canada";

        inputRadios[1].checked = false;
        inputRadios[1].radioButtonController = controller;

        expect(inputRadios[1].checked).toBe(true);
    });

    it("should change the checked property of all checkboxes sharing the same controller when one checkbox's checked property is set to true", function () {
        for (var i = 0; i < inputRadios.length; i++) {
            inputRadios[i].radioButtonController = controller;
            inputRadios[i].checked = false;
        }
        inputRadios[0].checked = true;

        inputRadios[1].checked = true;

        expect(inputRadios[0].checked).toBe(false);
        expect(inputRadios[1].checked).toBe(true);
        expect(inputRadios[2].checked).toBe(false);
    });

});
