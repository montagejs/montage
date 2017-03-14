var Montage = require("montage").Montage,
    URL = require("montage/core/mini-url");

describe("core/extras/url", function () {

    describe("convert relative url to absolute", function () {
        var savedBaseElem = document.head.querySelector("base"),
            baseElem = document.createElement("base");

        it("should be an absolute URL", function () {
            expect(URL.resolve("http://montagejs.org/", "./logo.jpeg")).toBe("http://montagejs.org/logo.jpeg");
        });

        it("should be an absolute URL despite new document's base", function () {
            if (savedBaseElem) {
                document.head.removeChild(savedBaseElem);
            }
            baseElem.href = "https://github.com/montagejs/montage/index.html"
            document.head.appendChild(baseElem);

            expect(URL.resolve("https://github.com/montagejs/montage/index.html", "../logo.jpeg")).toBe("https://github.com/montagejs/logo.jpeg");

            document.head.removeChild(baseElem);
            if (savedBaseElem) {
                document.head.appendChild(savedBaseElem);
            }
        });
    });

});

