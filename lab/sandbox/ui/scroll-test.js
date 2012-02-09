var Montage = require("montage/core").Montage,
    Textfield = require("montage/ui/textfield").Textfield,
    Scroll = require("montage/ui/scroll").Scroll;

var ScrollTest = exports.ScrollTest = Montage.create(Montage, {
    run: {
        value: function() {
            var scrollXTextfield = Montage.create(Textfield),
                scrollYTextfield = Montage.create(Textfield),
                scrollArea = Montage.create(Scroll);

            scrollXTextfield.element = document.getElementById("scrollX");
            scrollYTextfield.element = document.getElementById("scrollY");
            scrollXTextfield.needsDraw = true;
            scrollYTextfield.needsDraw = true;

            scrollArea.element=document.getElementById("dragAndDropArea");
            scrollArea.maxScrollX=1000;
            scrollArea.maxScrollY=500;

            Object.defineBinding(scrollXTextfield, "value", {boundObject: scrollArea, boundObjectPropertyPath: "scrollX"});
            Object.defineBinding(scrollYTextfield, "value", {boundObject: scrollArea, boundObjectPropertyPath: "scrollY"});
        }
    }
});

var test = Montage.create(ScrollTest);
test.run();
