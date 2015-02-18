var Montage = require("montage").Montage,
    AbstractVideo = require("montage/ui/base/abstract-video").AbstractVideo,
    MockDOM = require("mocks/dom");

AbstractVideo.prototype.hasTemplate = false;

describe("test/base/abstract-video-spec", function () {

    describe("creation", function () {
        it("cannot be instantiated directly", function () {
            expect(function () {
                new AbstractVideo();
            }).toThrow();
        });

        it("can be instantiated as a subtype", function () {
            var AbstractVideoSubtype = AbstractVideo.specialize({});
            var aAbstractVideoSubtype = null;
            expect(function () {
                aAbstractVideoSubtype = new AbstractVideoSubtype();
            }).not.toThrow();
            expect(aAbstractVideoSubtype).toBeDefined();
        });
    });

    describe("properties", function () {
        var VideoPlayer = AbstractVideo.specialize({}),
            aVideoPlayer;

        describe("videoController", function () {
            beforeEach(function () {
                aVideoPlayer = new VideoPlayer();
                aVideoPlayer.originalElement = MockDOM.element();
                aVideoPlayer.mediaElement = MockDOM.element();
                aVideoPlayer.enterDocument(true);
            });

            it("should be set after enterDocument()", function () {
                expect(aVideoPlayer.videoController).not.toBeNull();
            });

            it("should link native media controller to media element", function () {
                expect(aVideoPlayer.videoController.mediaController).toEqual(aVideoPlayer.mediaElement.controller);
            });

        });

        describe("src", function () {
            beforeEach(function () {
                aVideoPlayer = new VideoPlayer();
                aVideoPlayer.originalElement = MockDOM.element();
                aVideoPlayer.mediaElement = MockDOM.element();
            });

            it("should read initial value from original element", function () {
                aVideoPlayer.originalElement.setAttribute("src", "sample.mov");
                aVideoPlayer.enterDocument(true);

                expect(aVideoPlayer.src).toBe("sample.mov");
            });

            it("should read initial value from child source elements", function () {
                var sourceElements = [
                    MockDOM.element(),
                    MockDOM.element()
                ];
                sourceElements[0].tagName = "source";
                sourceElements[0].setAttribute("src", "movie1.ogg");
                sourceElements[0].setAttribute("type", "video/ogg");
                sourceElements[1].tagName = "source";
                sourceElements[1].setAttribute("src", "movie2.ogg");
                sourceElements[1].setAttribute("type", "video/ogg");
                aVideoPlayer.originalElement.childNodes = sourceElements;
                aVideoPlayer.mediaElement.canPlayType = function (type) {
                    if (type === "video/ogg") {
                        return "maybe";
                    }
                };
                aVideoPlayer.enterDocument(true);

                expect(aVideoPlayer.src).toBe("movie1.ogg");
            });

            it("should read initial value from child source elements only with valid type", function () {
                var sourceElements = [
                    MockDOM.element(),
                    MockDOM.element()
                ];
                sourceElements[0].tagName = "source";
                sourceElements[0].setAttribute("src", "movie1.ogg");
                sourceElements[0].setAttribute("type", "invalid/type");
                sourceElements[1].tagName = "source";
                sourceElements[1].setAttribute("src", "movie2.ogg");
                sourceElements[1].setAttribute("type", "video/ogg");
                aVideoPlayer.originalElement.childNodes = sourceElements;
                aVideoPlayer.mediaElement.canPlayType = function (type) {
                    if (type === "video/ogg") {
                        return "maybe";
                    }
                };
                aVideoPlayer.enterDocument(true);

                expect(aVideoPlayer.src).toBe("movie2.ogg");
            });
        });

        describe("sources", function () {
            beforeEach(function () {
                aVideoPlayer = new VideoPlayer();
                aVideoPlayer.element = MockDOM.element();
                aVideoPlayer.originalElement = MockDOM.element();
                aVideoPlayer.mediaElement = MockDOM.element();
                aVideoPlayer.element.ownerDocument.createElement = function () {
                    var element = MockDOM.element();
                    element.canPlayType = function (type) {
                        if (type === "video/ogg") {
                            return "maybe";
                        }
                    };
                    return element;
                };
                aVideoPlayer.enterDocument(true);
            });

            it("should use first source with known/valid media type", function () {
                aVideoPlayer.sources = [
                    {src: "movie1.ogg", type: "video/ogg"},
                    {src: "movie2.ogg", type: "video/ogg"}
                ];
                expect(aVideoPlayer.src).toBe("movie1.ogg");
            });

            it("should skip sources with unknown/invalid media type", function () {
                aVideoPlayer.sources = [
                    {src: "movie1.ogg", type: "invalid/type"},
                    {src: "movie2.ogg", type: "video/ogg"}
                ];
                expect(aVideoPlayer.src).toBe("movie2.ogg");
            });

            it("should save all sources", function () {
                var sources = [
                    {src: "movie1.ogg", type: "invalid/type"},
                    {src: "movie2.ogg", type: "video/ogg"}
                ];
                aVideoPlayer.sources = sources;
                expect(aVideoPlayer.sources).toEqual(sources);
            });
        });

        describe("repeat", function () {
            var VideoPlayer = AbstractVideo.specialize({}),
                aVideoPlayer;

            beforeEach(function () {
                aVideoPlayer = new VideoPlayer();
                aVideoPlayer.originalElement = MockDOM.element();
                aVideoPlayer.mediaElement = MockDOM.element();
                aVideoPlayer.enterDocument(true);
            });

            it("should have default value 'false'", function () {
                expect(aVideoPlayer.repeat).toBeFalsy();
            });

            it("can be set directly", function () {
                aVideoPlayer.repeat = true;
                expect(aVideoPlayer.repeat).toBeTruthy();
            });

            it("can be toggled", function () {
                aVideoPlayer.toggleRepeat();
                expect(aVideoPlayer.repeat).toBeTruthy();
            });

            it("can be toggled back", function () {
                aVideoPlayer.toggleRepeat();
                aVideoPlayer.toggleRepeat();
                expect(aVideoPlayer.repeat).toBeFalsy();
            });

        });


        describe("isFullScreen", function () {
            var VideoPlayer = AbstractVideo.specialize({}),
                aVideoPlayer;

            beforeEach(function () {
                aVideoPlayer = new VideoPlayer();
                aVideoPlayer.originalElement = MockDOM.element();
                aVideoPlayer.element = MockDOM.element();
                aVideoPlayer.mediaElement = MockDOM.element();
                aVideoPlayer.supportsFullScreen = true;
                aVideoPlayer.enterDocument(true);
            });

            it("should have default value 'false'", function () {
                expect(aVideoPlayer.isFullScreen).toBeFalsy();
            });

            it("can not be set directly", function () {
                aVideoPlayer.isFullScreen = true;
                expect(aVideoPlayer.isFullScreen).toBeFalsy();
            });

            it("can be toggled", function () {
                aVideoPlayer.toggleFullScreen();
                expect(aVideoPlayer.isFullScreen).toBeTruthy();
            });

            it("can not be toggled if fullscreen is not supported", function () {
                aVideoPlayer.supportsFullScreen = false;
                aVideoPlayer.toggleFullScreen();
                expect(aVideoPlayer.isFullScreen).toBeFalsy();
            });

            it("can be toggled back", function () {
                aVideoPlayer.toggleFullScreen();
                aVideoPlayer.toggleFullScreen();
                expect(aVideoPlayer.isFullScreen).toBeFalsy();
            });
        });

        describe("supportsFullScreen", function () {
            var VideoPlayer = AbstractVideo.specialize({}),
                aVideoPlayer;

            beforeEach(function () {
                aVideoPlayer = new VideoPlayer();
                aVideoPlayer.originalElement = MockDOM.element();
                aVideoPlayer.element = MockDOM.element();
                aVideoPlayer.mediaElement = MockDOM.element();
                aVideoPlayer.enterDocument(true);
            });

            it("should have default value 'true'", function () {
                expect(aVideoPlayer.supportsFullScreen).toBeTruthy();
            });

            it("can be set", function () {
                aVideoPlayer.supportsFullScreen = false;
                expect(aVideoPlayer.supportsFullScreen).toBeFalsy();
            });

        });

    });

    describe("draw", function () {
        var VideoPlayer = AbstractVideo.specialize(),
            aVideoPlayer;

        beforeEach(function () {
            aVideoPlayer = new VideoPlayer();
            aVideoPlayer.originalElement = MockDOM.element();
            aVideoPlayer.mediaElement = MockDOM.element();
            aVideoPlayer.enterDocument(true);
        });

        it("should be requested after repeat state is changed", function () {
            aVideoPlayer.repeat = !aVideoPlayer.repeat;
            expect(aVideoPlayer.needsDraw).toBeTruthy();
        });

        it("should be requested after controller volume is changed", function () {
            aVideoPlayer.videoController.volume = 47;
            expect(aVideoPlayer.needsDraw).toBeTruthy();
        });

        it("should be requested after controller status is changed", function () {
            aVideoPlayer.videoController.status = aVideoPlayer.videoController.PLAYING;
            expect(aVideoPlayer.needsDraw).toBeTruthy();
        });

    });

});
