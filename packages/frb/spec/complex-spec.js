
var Bindings = require("..");

describe("complex binding chain", function () {

    var trace = false;

    var ui = Bindings.defineBindings({
        apples: {checked: true},
        oranges: {checked: false},
        selected: "apples",
        fruit: {classList: [], value: "apples"},
        reflectApples: {checked: true}
    }, {
        "apples.checked": {"<->": "selected = 'apples'", trace: trace},
        "oranges.checked": {"<->": "selected = 'oranges'", trace: trace},
        "!apples.checked": {"<->": "oranges.checked", trace: trace},
        "selected": {"<->": "fruit.value", trace: trace},
        "reflectApples.checked": {"<->": "selected = 'apples'", trace: trace},
        "!reflectApples.checked": {"<->": "selected = 'oranges'", trace: trace},
    });

    function expectApples() {
        expect(ui.apples.checked).toEqual(true);
        expect(ui.oranges.checked).toEqual(false);
        expect(ui.selected).toEqual("apples");
        expect(ui.fruit.value).toEqual("apples");
        expect(ui.fruit.classList.length).toEqual(0);
        expect(ui.reflectApples.checked).toEqual(true);
    }

    function expectOranges() {
        expect(ui.apples.checked).toEqual(false);
        expect(ui.oranges.checked).toEqual(true);
        expect(ui.selected).toEqual("oranges");
        expect(ui.fruit.value).toEqual("oranges");
        expect(ui.fruit.classList.length).toEqual(0);
        expect(ui.reflectApples.checked).toEqual(false);
    }

    it("should work", function () {

        ui.apples.checked = true;
        expectApples();

        ui.apples.checked = false;
        expectOranges();

        ui.oranges.checked = false;
        ui.oranges.checked = true;
        expectOranges();

        ui.oranges.checked = false;
        expectApples();

        ui.fruit.value = "apples";
        expectApples();

        ui.fruit.value = "oranges";
        expectOranges();

        ui.reflectApples.checked = true;
        expectApples();

        ui.reflectApples.checked = false;
        expectOranges();

    });

});

