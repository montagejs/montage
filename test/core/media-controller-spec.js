var Montage = require("montage").Montage,
    MediaController = require("montage/core/media-controller").MediaController,
    MockDOM = require("mocks/dom"),
    MockEvent = require("mocks/event"),
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

        describe("playbackRate", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should have correct default value", function() {
                expect(aMediaController.playbackRate).toEqual(1);
            });
            
            it("can be set", function() {
                aMediaController.playbackRate = 0.5;
                expect(aMediaController.playbackRate).toEqual(0.5);
            });
            
            it("can be negative", function() {
                aMediaController.playbackRate = -0.5;
                expect(aMediaController.playbackRate).toEqual(-0.5);
            });
            
            it("should set playback rate on native media controller", function() {
                aMediaController.playbackRate = 0.5;
                expect(aMediaController.mediaController.playbackRate).toEqual(0.5);
            });

        });

        describe("currentTime", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should have correct default value", function() {
                expect(aMediaController.currentTime).toEqual(0);
            });
            
            it("can be set", function() {
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.currentTime = 142;
                expect(aMediaController.currentTime).toEqual(142);
            });
            
            it("can not be set when status is EMPTY", function() {
                aMediaController.status = aMediaController.EMPTY;
                aMediaController.currentTime = 142;
                expect(aMediaController.currentTime).toEqual(0);
            });
            
            it("should update currentTime on native controller", function() {
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.currentTime = 142;
                expect(aMediaController.mediaController.currentTime).toEqual(142);
            });

        });

        describe("duration", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should have correct default value", function() {
                expect(aMediaController.duration).toBeNull();
            });
            
            it("can be set", function() {
                aMediaController.duration = 5256;
                expect(aMediaController.duration).toEqual(5256);
            });
        });
        
        describe("autoplay", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should have correct default value", function() {
                expect(aMediaController.autoplay).toEqual(false);
            });
            
            it("can be set", function() {
                aMediaController.autoplay = true;
                expect(aMediaController.autoplay).toEqual(true);
                aMediaController.autoplay = false;
                expect(aMediaController.autoplay).toEqual(false);
            });
        });

        describe("volume", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should have correct default value", function() {
                expect(aMediaController.volume).toEqual(100);
            });
            
            it("can be set", function() {
                aMediaController.volume = 53;
                expect(aMediaController.volume).toEqual(53);
            });

            it("should set volume on native controller", function() {
                controller.volume = 1;
                aMediaController.volume = 53;
                expect(controller.volume).toEqual(0.53);
            });

        });

        describe("mute", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should have correct default value", function() {
                expect(aMediaController.mute).toEqual(false);
            });
            
            it("can be set", function() {
                aMediaController.mute = true;
                expect(aMediaController.mute).toEqual(true);
                aMediaController.mute = false;
                expect(aMediaController.mute).toEqual(false);
            });
            
            it("should set muted on native controller", function() {
                controller.muted = false;
                aMediaController.mute = true;
                expect(controller.muted).toEqual(true);
            });

        });

        describe("status", function () {
            var aMediaController;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should have default value of EMPTY", function() {
                expect(aMediaController.status).toEqual(aMediaController.EMPTY);
            });
            
            it("can be set", function() {
                aMediaController.status = aMediaController.STOPPED;
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

    });

    describe("functions", function () {
    
        describe("play", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should call play on media controller", function() {
                var wasCalled = false;
                controller.play = function() {
                    wasCalled = true;
                };
                aMediaController.play();
                expect(wasCalled).toEqual(true);
            });
            
            it("should play from the beginning", function() {
                aMediaController.currentTime = 1000;
                aMediaController.play();
                expect(aMediaController.currentTime).toEqual(0);
            });
        });

        describe("pause", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should call pause on media controller", function() {
                var wasCalled = false;
                controller.pause = function() {
                    wasCalled = true;
                };
                aMediaController.pause();
                expect(wasCalled).toEqual(true);
            });
        });

        describe("unpause", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should call unpause on media controller", function() {
                var wasCalled = false;
                controller.unpause = function() {
                    wasCalled = true;
                };
                aMediaController.unpause();
                expect(wasCalled).toEqual(true);
            });
        });

        describe("playPause", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should call play on media controller if not playing", function() {
                var wasCalled = false;
                controller.play = function() {
                    wasCalled = true;
                };
                aMediaController.status = aMediaController.STOPPED;
                aMediaController.playPause();
                expect(wasCalled).toEqual(true);
            });
            
            it("should call pause on media controller if playing", function() {
                var wasCalled = false;
                controller.pause = function() {
                    wasCalled = true;
                };
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.playPause();
                expect(wasCalled).toEqual(true);
            });
        });

        describe("rewind", function () {
            var aMediaController;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should set playback rate to -4.0 when playing", function() {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.rewind();
                expect(aMediaController.playbackRate).toEqual(-4.0);
            });

            it("should not change playback rate if not playing", function() {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.STOPPED;
                aMediaController.rewind();
                expect(aMediaController.playbackRate).toEqual(1.0);
            });

        });

        describe("fastForward", function () {
            var aMediaController;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should set playback rate to 4.0 when playing", function() {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.fastForward();
                expect(aMediaController.playbackRate).toEqual(4.0);
            });

            it("should not change playback rate if not playing", function() {
                aMediaController.playbackRate = 1.0;
                aMediaController.status = aMediaController.STOPPED;
                aMediaController.fastForward();
                expect(aMediaController.playbackRate).toEqual(1.0);
            });
        });

        describe("stop", function () {
            var aMediaController,
                controller;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
            });

            it("should call pause on media controller", function() {
                var wasCalled = false;
                controller.pause = function() {
                    wasCalled = true;
                };
                aMediaController.stop();
                expect(wasCalled).toEqual(true);
            });
            
            it("should set current time on media controller to zero", function() {
                controller.currentTime = 500;
                aMediaController.stop();
                expect(controller.currentTime).toEqual(0);
            });
            
            it("should set status to STOPPED", function() {
                aMediaController.status = aMediaController.PLAYING;
                aMediaController.stop();
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });

        describe("volumeIncrease", function () {
            var aMediaController;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should increase volume by 10", function() {
                aMediaController.volume = 40;
                aMediaController.volumeIncrease();
                expect(aMediaController.volume).toEqual(50);
            });
        });

        describe("volumeDecrease", function () {
            var aMediaController;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should decrease volume by 10", function() {
                aMediaController.volume = 40;
                aMediaController.volumeDecrease();
                expect(aMediaController.volume).toEqual(30);
            });
        });

        describe("toggleMute", function () {
            var aMediaController;
            
            beforeEach(function () {
                aMediaController = new MediaController();
            });

            it("should set mute to false if muted", function() {
                aMediaController.mute = true;
                aMediaController.toggleMute();
                expect(aMediaController.mute).toEqual(false);
            });

            it("should set mute to true if not muted", function() {
                aMediaController.mute = false;
                aMediaController.toggleMute();
                expect(aMediaController.mute).toEqual(true);
            });

        });

    });

    describe("events", function () {
    
        describe("loadedmetadata", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("loadedmetadata", true, true, null);
            });

            it("should set status to STOPPED", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });

            it("should start playing if autoplay=true", function() {
                var wasCalled = false;
                controller.play = function() {
                    wasCalled = true;
                };

                aMediaController.autoplay = true;

                controller.dispatchEvent(anEvent);
                expect(wasCalled).toEqual(true);
            });

            it("should read duration from native media controller", function() {
                controller.duration = 67;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.duration).toEqual(67);
            });
        });
        
        describe("timeupdate", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("timeupdate", true, true, null);
            });
            
            it("should update the position value", function() {
                aMediaController.position = 26;
                controller.currentTime = 34;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.position).toEqual(34);
            });
            
            it("should not update the position value if stopped", function() {
                aMediaController.position = 26;
                aMediaController.status = aMediaController.STOPPED;
                controller.currentTime = 34;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.position).toEqual(26);
            });
        });
        
        describe("play", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("play", true, true, null);
            });
            
            it("should set the status to PLAYING", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.PLAYING);
            });
        });
        
        describe("playing", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("playing", true, true, null);
            });
            
            it("should set the status to PLAYING", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.PLAYING);
            });
        });
        
        describe("pause", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("pause", true, true, null);
            });
            
            it("should set the status to PAUSED", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.PAUSED);
            });
            
            it("should not change the status if stopped", function() {
                aMediaController.status = aMediaController.STOPPED;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });
        
        describe("abort", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("abort", true, true, null);
            });
            
            it("should set the status to STOPPED", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });
        
        describe("error", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("error", true, true, null);
            });
            
            it("should set the status to STOPPED", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });
        
        describe("emptied", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("emptied", true, true, null);
            });
            
            it("should set the status to STOPPED", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });
        
        describe("ended", function () {
            var aMediaController,
                controller,
                anEvent;
            
            beforeEach(function () {
                aMediaController = new MediaController();
                controller = aMediaController.mediaController;
                anEvent = MockEvent.event("ended", true, true, null);
            });
            
            it("should set the status to STOPPED", function() {
                aMediaController.status = aMediaController.EMPTY;
                controller.dispatchEvent(anEvent);
                expect(aMediaController.status).toEqual(aMediaController.STOPPED);
            });
        });
        
    });
    
});
