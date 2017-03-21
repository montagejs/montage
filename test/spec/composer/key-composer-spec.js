/*global require,exports,describe,it,expect,waits,runs */
var Montage = require("montage").Montage;
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;
var KeyComposer = require("montage/composer/key-composer").KeyComposer;

TestPageLoader.queueTest("key-composer-test/key-composer-test", function (testPage) {
    var test,
        userAgent = navigator.userAgent,
        command;

    beforeEach(function () {
        test = testPage.test;
    });

    /* NOTE: The following tests wont work on Opera for Mac because of the way Opera handles modifiers on that platform
     */

    if (userAgent.match(/macintosh/i)) {
        command = "meta"
    } else {
        command = "control"
    }

    describe("composer/key-composer-spec", function () {
        describe("KeyComposer", function (){
            xit("should fire keyPress, longKeyPress and keyRelease when pressing,  holding and releasing a composerKey", function (done) {
                var target = test.example.element,
                    listener1 = testPage.addListener(test.key_composer1, null, "keyPress"),
                    listener2 = testPage.addListener(test.key_composer1, null, "longKeyPress"),
                    listener3 = testPage.addListener(test.key_composer1, null, "keyRelease");

                testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keydown");
                setTimeout(function (){
                    testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keyup");
                    expect(listener1).toHaveBeenCalled();
                    expect(listener2).toHaveBeenCalled();
                    expect(listener3).toHaveBeenCalled();
                    done();
                }, 1050);
            });

            it("should not fire keyComposer's event when pressing a composerKey which is not in the target path", function (done) {
                var target = test.example.element.parentNode,
                    keyPressCalled = false,
                    keyReleaseCalled = false;

                test.key_composer1.addEventListener("keyPress", function (){keyPressCalled = true});
                test.key_composer1.addEventListener("keyRelease", function (){keyReleaseCalled = true});

                testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keydown");
                setTimeout(function (){
                    testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keyup");
                    expect(keyPressCalled).toBeFalsy();
                    expect(keyReleaseCalled).toBeFalsy();
                    done();
                }, 50);
            });

            xit("should fire keyPress and KeyRelease on pressing a global key whatever of the target", function (done) {
                var target = test.example.element.parentNode;

                test.keyPressCalled = false;
                test.keyReleaseCalled = false;

                testPage.keyEvent({target: target, modifiers: "shift control", charCode: 0, keyCode: "K".charCodeAt(0)}, "keydown");
                setTimeout(function (){
                    testPage.keyEvent({target: target, modifiers: "shift control", charCode: 0, keyCode: "K".charCodeAt(0)}, "keyup");
                    expect(test.keyPressCalled).toBeTruthy();
                    expect(test.keyReleaseCalled).toBeTruthy();
                    done();
                }, 50);
            });

            it("should not fire keyPress and KeyRelease on pressing shift+k+control (modifier pressed after the main key)", function (done) {
                var target = test.example.element.parentNode;

                test.keyPressCalled = false;
                test.keyReleaseCalled = false;

                testPage.keyEvent({target: target, modifiers: "shift", charCode: 0, keyCode: "K".charCodeAt(0)}, "keydown");
                
                setTimeout(function (){
                    testPage.keyEvent({target: target, modifiers: "shift control", charCode: 0, keyCode: "K".charCodeAt(0)}, "keyup");
                    expect(test.keyPressCalled).toBeFalsy();
                    expect(test.keyReleaseCalled).toBeFalsy();
                    done();
                }, 50);
            });

            describe("interacting with activeTarget", function () {
                xit("should fire window key events on composers of the activeTarget", function (done) {
                    var target = test.example.element,
                        listener1 = testPage.addListener(test.key_composer1, null, "keyPress"),
                        listener2 = testPage.addListener(test.key_composer1, null, "longKeyPress"),
                        listener3 = testPage.addListener(test.key_composer1, null, "keyRelease");

                    testPage.window.mr("montage/core/event/event-manager").defaultEventManager.activeTarget = test.example;

                    testPage.keyEvent({target: testPage.window, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keydown");
                    setTimeout(function (){
                        testPage.keyEvent({target: testPage.window, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keyup");
                        expect(listener1).toHaveBeenCalled();
                        expect(listener2).toHaveBeenCalled();
                        expect(listener3).toHaveBeenCalled();
                        done();
                    }, 1050);
                });
            });
        });
    });
});
