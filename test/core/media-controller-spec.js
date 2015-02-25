var Montage = require("montage").Montage,
    MediaController = require("montage/core/media-controller").MediaController,
    MockDOM = require("mocks/dom"),
    MockEvent = require("mocks/event");

describe("core/media-controller-spec", function () {

    var aMediaController,
        mediaElement;

    beforeEach(function () {
        aMediaController = new MediaController();
        mediaElement = MockDOM.element();
        mediaElement.muted = false;
        mediaElement.currentTime = 0;
        mediaElement.volume = 1;
        mediaElement.duration = 200;
        mediaElement.play = Function.noop;
        mediaElement.pause = Function.noop;
        mediaElement.stop = Function.noop;

        aMediaController.mediaElement = mediaElement;
    });

    describe("creation", function () {
        it("can be instantiated directly", function () {
            expect(function () {
                new MediaController();
            }).not.toThrow();
        });
    });

    describe("properties", function () {

        describe("playbackRate", function () {
            it("should have correct default value", function () {
                expect(aMediaController.playbackRate).toEqual(1);
            });

            it("can be set", function () {
                aMediaController.playbackRate = 0.5;
                expect(aMediaController.playbackRate).toEqual(0.5);
            });

            it("can be negative", function () {
                aMediaController.playbackRate = -0.5;
                expect(aMediaController.playbackRate).toEqual(-0.5);
            });
        });

        describe("currentTime", function () {
            it("should have correct default value", function () {
                expect(aMediaController.currentTime).toEqual(0);
            });

            it("can be set", function () {
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.currentTime = 142;
                expect(aMediaController.currentTime).toEqual(142);
            });

            it("can not be set when status is EMPTY", function () {
                aMediaController.status = aMediaController.EMPTY;
                aMediaController.currentTime = 142;
                expect(aMediaController.currentTime).toEqual(0);
            });
        });

        describe("duration", function () {
            it("should have correct default value", function () {
                expect(aMediaController.duration).toBeNull();
            });

            it("can be set", function () {
                aMediaController.duration = 5256;
                expect(aMediaController.duration).toEqual(5256);
            });
        });

        describe("autoplay", function () {
            it("should have correct default value", function () {
                expect(aMediaController.autoplay).toEqual(false);
            });

            it("can be set", function () {
                aMediaController.autoplay = true;
                expect(aMediaController.autoplay).toEqual(true);
                aMediaController.autoplay = false;
                expect(aMediaController.autoplay).toEqual(false);
            });
        });

        describe("volume", function () {
            it("should have correct default value", function () {
                expect(aMediaController.volume).toEqual(100);
            });

            it("can be set", function () {
                aMediaController.volume = 53;
                expect(aMediaController.volume).toEqual(53);
                expect(mediaElement.volume).toEqual(0.53);
            });
        });

        describe("mute", function () {
            it("should have correct default value", function () {
                expect(aMediaController.mute).toEqual(false);
            });

            it("can be set", function () {
                aMediaController.mute = true;
                expect(aMediaController.mute).toEqual(true);
                aMediaController.mute = false;
                expect(aMediaController.mute).toEqual(false);
            });

            it("should set muted on native controller", function () {
                aMediaController.mute = true;
                expect(mediaElement.muted).toEqual(true);
            });

        });

        describe("status", function () {
            it("should have default value of EMPTY", function () {
                expect(aMediaController.status).toEqual(aMediaController.EMPTY);
            });

            it("can be set", function () {
                aMediaController.status = aMediaController.STOPPED;
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

    });

    describe("functions", function () {

        describe("play", function () {
            it("should play from the beginning", function () {
                aMediaController.currentTime = 1000;
                aMediaController.play();
                expect(aMediaController.currentTime).toEqual(0);
            });
        });

        describe("playPause", function () {
            it("should call play on media controller if not playing", function () {
                var wasCalled = false;
                aMediaController.play = function () {
                    wasCalled = true;
                };
                aMediaController.status = aMediaController.STOPPED;
                aMediaController.playPause();
                expect(wasCalled).toEqual(true);
            });

            it("should call pause on media controller if playing", function () {
                var wasCalled = false;
                aMediaController.pause = function () {
                    wasCalled = true;
                };
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.playPause();
                expect(wasCalled).toEqual(true);
            });
        });

        describe("rewind", function () {
            it("should set playback rate to -4.0 when playing", function () {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.rewind();
                expect(aMediaController.playbackRate).toEqual(-4.0);
            });

            it("should not change playback rate if not playing", function () {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.STOPPED;
                aMediaController.rewind();
                expect(aMediaController.playbackRate).toEqual(1.0);
            });

        });

        describe("fastForward", function () {
            it("should set playback rate to 4.0 when playing", function () {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.fastForward();
                expect(aMediaController.playbackRate).toEqual(4.0);
            });

            it("should not change playback rate if not playing", function () {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.STOPPED;
                aMediaController.fastForward();
                expect(aMediaController.playbackRate).toEqual(1.0);
            });
        });

        describe("stop", function () {
            it("should set current time on media controller to zero", function () {
                aMediaController.currentTime = 500;
                aMediaController.stop();
                expect(aMediaController.currentTime).toEqual(0);
            });

            it("should set status to STOPPED", function () {
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.stop();
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

        describe("volumeIncrease", function () {
            it("should increase volume by 10", function () {
                aMediaController.volume = 40;
                aMediaController.volumeIncrease();
                expect(aMediaController.volume).toEqual(50);
            });
        });

        describe("volumeDecrease", function () {
            it("should decrease volume by 10", function () {
                aMediaController.volume = 40;
                aMediaController.volumeDecrease();
                expect(aMediaController.volume).toEqual(30);
            });
        });

        describe("toggleMute", function () {
            it("should set mute to false if muted", function () {
                aMediaController.mute = true;
                aMediaController.toggleMute();
                expect(aMediaController.mute).toEqual(false);
            });

            it("should set mute to true if not muted", function () {
                aMediaController.mute = false;
                aMediaController.toggleMute();
                expect(aMediaController.mute).toEqual(true);
            });

        });

    });

    describe("events", function () {

        describe("loadedmetadata", function () {
            var anEvent;

            beforeEach(function () {
                anEvent = MockEvent.event("loadedmetadata", true, true, null);
            });

            it("should set status to STOPPED", function () {
                aMediaController.status = aMediaController.EMPTY;
                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });

            it("should start playing if autoplay=true", function () {
                var wasCalled = false;
                aMediaController.play = function () {
                    wasCalled = true;
                };

                aMediaController.autoplay = true;

                mediaElement.dispatchEvent(anEvent);
                expect(wasCalled).toEqual(true);
            });
        });

        describe("timeupdate", function () {
            var anEvent;

            beforeEach(function () {
                anEvent = MockEvent.event("timeupdate", true, true, null);
            });

            it("should update the position value", function () {
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.position = 26;
                aMediaController.currentTime = 34;
                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.position).toEqual(34);
            });

            it("should not update the position value if stopped", function () {
                aMediaController.position = 26;
                aMediaController.status = aMediaController.STOPPED;
                aMediaController.currentTime = 34;
                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.position).toEqual(26);
            });
        });

        describe("play", function () {
            it("should set the status to PLAYING", function () {
                aMediaController.status = aMediaController.EMPTY;
                var anEvent = MockEvent.event("play", true, true, null);

                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.PLAYING);
            });
        });

        describe("playing", function () {
            it("should set the status to PLAYING", function () {
                aMediaController.status = aMediaController.EMPTY;
                var anEvent = MockEvent.event("playing", true, true, null);

                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.PLAYING);
            });
        });

        describe("pause", function () {
            var anEvent;

            beforeEach(function () {
                anEvent = MockEvent.event("pause", true, true, null);
            });

            it("should set the status to PAUSED", function () {
                aMediaController.status = aMediaController.EMPTY;
                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.PAUSED);
            });

            it("should not change the status if stopped", function () {
                aMediaController.status = aMediaController.STOPPED;
                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

        describe("abort", function () {
            it("should set the status to STOPPED", function () {
                aMediaController.status = aMediaController.EMPTY;
                var anEvent = MockEvent.event("abort", true, true, null);

                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

        describe("error", function () {
            it("should set the status to STOPPED", function () {
                aMediaController.status = aMediaController.EMPTY;
                var anEvent = MockEvent.event("error", true, true, null);

                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

        describe("emptied", function () {
            it("should set the status to STOPPED", function () {
                var anEvent = MockEvent.event("emptied", true, true, null);
                aMediaController.status = aMediaController.EMPTY;

                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

        describe("ended", function () {
            it("should set the status to STOPPED", function () {
                var anEvent = MockEvent.event("ended", true, true, null);
                aMediaController.status = aMediaController.EMPTY;

                mediaElement.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

    });

});
