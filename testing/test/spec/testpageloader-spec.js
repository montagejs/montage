var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("application/as-application", {src: "spec/application/as-application.html"}, function (testPage) {
    describe("application-spec", function () {
        describe("Application used in application label", function () {
            it("should draw correctly", function () {
                expect(testPage.test).toBeDefined();
            });

            it("should be THE application", function () {
                expect(testPage.test.theOne).toEqual("true");
            });
        });
   });
});

TestPageLoader.queueTest("application/as-owner", {src: "spec/application/as-owner.html"}, function (testPage) {
    describe("application-spec", function () {
        describe("Application used in owner label", function () {
            it("should draw correctly", function () {
                expect(testPage.test).toBeDefined();
            });
        });
   });

    describe("testpageloader-spec", function () {
        var text, pureElement;

        beforeAll(function () {
            text = testPage.document.getElementById("text").component;
            pureElement = testPage.document.getElementById("pureElement");
        });

        describe("keyEvent", function () {
            it("calls its callback", function (done) {
                testPage.keyEvent({ target: text, keyCode: "J".charCodeAt(0) }, "keypress", function () {
                    done();
                });
            });

            it("fires an event on a component", function (done) {
                text.addEventListener("keypress", function (event) {
                    expect(event.keyCode).toEqual("J".charCodeAt(0));
                    done();
                });
                testPage.keyEvent({ target: text, keyCode: "J".charCodeAt(0) }, "keypress");
            });

            it("fires an event on an element", function (done) {
                pureElement.addEventListener("keypress", function (event) {
                    expect(event.keyCode).toEqual("J".charCodeAt(0));
                    done();
                });
                testPage.keyEvent({ target: pureElement, keyCode: "J".charCodeAt(0) }, "keypress");
            });
        });

        describe("wheelEvent", function () {
            it("calls its callback", function (done) {
                testPage.wheelEvent({ target: text }, "wheel", function () {
                    done();
                });
            });

            it("fires an event on a component", function (done) {
                text.addEventListener("wheel", function () {
                    done();
                });
                testPage.wheelEvent({ target: text }, "wheel");
            });

            it("fires an event on an element", function (done) {
                pureElement.addEventListener("wheel", function () {
                    done();
                });
                testPage.wheelEvent({ target: pureElement }, "wheel");
            });
        });

        describe("mouseEvent", function () {
            it("calls its callback", function (done) {
                testPage.mouseEvent({ target: text }, "click", function () {
                    done();
                });
            });

            it("fires an event on a component", function (done) {
                text.addEventListener("click", function () {
                    done();
                });
                testPage.mouseEvent({ target: text }, "click");
            });

            it("fires an event on an element", function (done) {
                pureElement.addEventListener("click", function () {
                    done();
                });
                testPage.mouseEvent({ target: pureElement }, "click");
            });
        });

        describe("touchEvent", function () {
            it("calls its callback", function (done) {
                testPage.touchEvent({ target: text }, "touchStart", function () {
                    done();
                });
            });

            it("fires an event on a component", function (done) {
                text.addEventListener("touchStart", function (event) {
                    expect(event.touches.length).toBe(1);
                    done();
                });
                testPage.touchEvent({ target: text }, "touchStart");
            });

            it("fires an event on an element", function (done) {
                pureElement.addEventListener("touchStart", function (event) {
                    expect(event.touches.length).toBe(1);
                    done();
                });
                testPage.touchEvent({ target: pureElement }, "touchStart");
            });
        });

        describe("clickOrTouch", function () {
            var oldTouch = global.Touch;

            it("dispatches mouse events", function (done) {
                var isMousedownFired = false,
                    isMouseupFired = false,
                    isClickFired = false;
                global.Touch = void 0;
                text.addEventListener("mousedown", function () {
                    isMousedownFired = true;
                });
                text.addEventListener("mouseup", function () {
                    expect(isMousedownFired).toBe(true);
                    isMouseupFired = true;
                });
                text.addEventListener("click", function () {
                    expect(isMouseupFired).toBe(true);
                    isClickFired = true;
                });
                testPage.clickOrTouch({ target: text }, function () {
                    expect(isClickFired).toBe(true);
                    done();
                });
            });

            it("dispatches touch events", function (done) {
                var isTouchstartFired = false,
                    isTouchendFired = false,
                    isClickFired = false;
                global.Touch = oldTouch || Function.noop;
                text.addEventListener("touchstart", function () {
                    isTouchstartFired = true;
                });
                text.addEventListener("touchend", function () {
                    expect(isTouchstartFired).toBe(true);
                    isTouchendFired = true;
                });
                text.addEventListener("click", function () {
                    expect(isTouchendFired).toBe(true);
                    isClickFired = true;
                });
                testPage.clickOrTouch({ target: text }, function () {
                    expect(isClickFired).toBe(true);
                    done();
                });
            });

            afterAll(function () {
                global.Touch = oldTouch;
            });
        });

        describe("dragElementOffsetTo", function () {
            it("drags an element", function (done) {
                var isMousedownFired = false,
                    isMousemoveFired = false,
                    moveX, moveY,
                    isMouseupFired = false;
                pureElement.addEventListener("mousedown", function () {
                    isMousedownFired = true;
                });
                pureElement.addEventListener("mousemove", function (event) {
                    isMousemoveFired = true;
                    moveX = event.clientX;
                    moveY = event.clientY;
                });
                pureElement.addEventListener("mouseup", function () {
                    isMouseupFired = true;
                });
                testPage.dragElementOffsetTo(pureElement, 200, 150, function () {
                    expect(isMousedownFired).toBe(true);
                }, function () {
                    expect(isMousemoveFired).toBe(true);
                    expect(moveX).toBe(pureElement.offsetLeft + 200);
                    expect(moveY).toBe(pureElement.offsetLeft + 150);
                }, function () {
                    expect(isMouseupFired).toBe(true);
                    done();
                })
            });
        });
    });
});
