var Montage = require("montage").Montage,
    MediaController = require("montage/core/media-controller").MediaController,
    MockDOM = require("mocks/dom"),
    MockMediaController = require("mocks/mediacontroller");

describe("core/media-controller-spec", function() {

    var nativeMediaController;

    beforeEach(function () {
        nativeMediaController = window.MediaController;
        window.MediaController = function() {
            return MockMediaController.mediaController();
        }
    });

    afterEach(function () {
        window.MediaController = nativeMediaController;
    });            

    describe("creation", function () {
        it("can be instantiated directly", function () {
            expect(function () {
                new MediaController();
            }).not.toThrow();
        });
    });

    describe("properties", function () {
    
        describe("mediaController", function () {
            var aMediaController;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should create media controller automatically", function() {
                expect(aMediaController.mediaController).not.toBeNull();
            });

        });
    });
    
    
});
