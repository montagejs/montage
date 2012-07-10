/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/*global require,exports,describe,it,expect,waits,runs */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    KeyComposer = require("montage/ui/composer/key-composer").KeyComposer;

var testPage = TestPageLoader.queueTest("key-composer-test", function() {
    var test = testPage.test,
        userAgent = navigator.userAgent,
        command;

    /* NOTE: The following tests wont work on Opera for Mac because of the way Opera handles modifiers on that platform
     */

    if (userAgent.match(/macintosh/i)) {
        command = "meta"
    } else {
        command = "control"
    }

    describe("ui/composer/key-composer-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("KeyComposer", function(){
            it("should fire keyPress, longKeyPress and keyRelease when pressing,  holding and releasing a composerKey", function() {
                var target = test.example.element,
                    listener1 = testPage.addListener(test.key_composer1, null, "keyPress"),
                    listener2 = testPage.addListener(test.key_composer1, null, "longKeyPress"),
                    listener3 = testPage.addListener(test.key_composer1, null, "keyRelease");

                testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keydown");
                waits(1050);
                runs(function(){
                    testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keyup");
                    expect(listener1).toHaveBeenCalled();
                    expect(listener2).toHaveBeenCalled();
                    expect(listener3).toHaveBeenCalled();
                });
            });

            it("should not fire keyComposer's event when pressing a composerKey which is not in the target path", function() {
                console.log(window.document.title)
                var target = test.example.element.parentNode,
                    keyPressCalled = false,
                    keyReleaseCalled = false;

                test.key_composer1.addEventListener("keyPress", function(){keyPressCalled = true});
                test.key_composer1.addEventListener("keyRelease", function(){keyReleaseCalled = true});

                testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keydown");
                waits(50);
                runs(function(){
                    testPage.keyEvent({target: target, modifiers: command, charCode: 0, keyCode: "J".charCodeAt(0)}, "keyup");
                    expect(keyPressCalled).toBeFalsy();
                    expect(keyReleaseCalled).toBeFalsy();
                });
            });

            it("should fire keyPress and KeyRelease on pressing a global key whatever of the target", function() {
                var target = test.example.element.parentNode;

                test.keyPressCalled = false;
                test.keyReleaseCalled = false;

                testPage.keyEvent({target: target, modifiers: "shift control", charCode: 0, keyCode: "K".charCodeAt(0)}, "keydown");
                waits(50);
                runs(function(){
                    testPage.keyEvent({target: target, modifiers: "shift control", charCode: 0, keyCode: "K".charCodeAt(0)}, "keyup");
                    expect(test.keyPressCalled).toBeTruthy();
                    expect(test.keyReleaseCalled).toBeTruthy();
                });
            });

            it("should not fire keyPress and KeyRelease on pressing shift+k+control (modifier pressed after the main key)", function() {
                var target = test.example.element.parentNode;

                test.keyPressCalled = false;
                test.keyReleaseCalled = false;

                testPage.keyEvent({target: target, modifiers: "shift", charCode: 0, keyCode: "K".charCodeAt(0)}, "keydown");
                waits(50);
                runs(function(){
                    testPage.keyEvent({target: target, modifiers: "shift control", charCode: 0, keyCode: "K".charCodeAt(0)}, "keyup");
                    expect(test.keyPressCalled).toBeFalsy();
                    expect(test.keyReleaseCalled).toBeFalsy();
                });
            });
        });
    });
});
