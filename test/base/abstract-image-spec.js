var Montage = require("montage").Montage;
var AbstractImage = require("montage/ui/base/abstract-image").AbstractImage;
var MockDOM = require("mocks/dom");

AbstractImage.hasTemplate = false;

var src1 = "data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

describe("test/base/abstract-image-spec", function () {
    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                AbstractImage.create();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var ImageSubtype = Montage.create(AbstractImage, {});
            var anImageSubtype;
            expect(function () {
                anImageSubtype = ImageSubtype.create();
            }).not.toThrow();
            expect(anImageSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var Image = Montage.create(AbstractImage, {}),
            anImage;

        beforeEach(function () {
            anImage = Image.create();
            anImage.element = MockDOM.element();
        });

        describe("src", function () {
            beforeEach(function () {
                anImage = Image.create();
                anImage.element = MockDOM.element();
            });

            it("should start loading the new image", function() {
                anImage.src = src1;

                expect(anImage._isLoadingImage).toBeTruthy();
                expect(anImage._image.src).toBe(src1);
            });
        });
    });

    describe("draw", function () {
        var Image = Montage.create(AbstractImage, {}),
            anImage;

        beforeEach(function () {
            anImage = Image.create();
            anImage.element = MockDOM.element();
            anImage.needsDraw = false;
        });

        it("should be requested after src is changed", function () {
            anImage.src = src1;
            expect(anImage.needsDraw).toBeTruthy();
        });

        it("should draw the empty image when src is changed and hasn't been loaded yet", function () {
            anImage.src = src1;
            anImage.draw();
            expect(anImage.element.src).toBe(anImage.emptyImageSrc);
        });

        it("should draw the image when src is changed and it has been loaded", function () {
            anImage.src = src1;
            anImage._isLoadingImage = false;
            anImage.draw();
            expect(anImage.element.src).toBe(src1);
        });
    });
});