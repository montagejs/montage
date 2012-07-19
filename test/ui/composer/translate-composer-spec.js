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
    ActionEventListener = require("montage/core/event/action-event-listener").ActionEventListener;

var testPage = TestPageLoader.queueTest("translate-composer-test", function() {
    var test = testPage.test;

    describe("ui/composer/translate-composer-spec", function() {
        it("should load", function() {
            expect(testPage.loaded).toBe(true);
        });

        describe("TranslateComposer", function(){
            it("can be created", function() {
                expect(test.translate_composer).toBeDefined();
            });

            describe("translateX", function() {
                it("updates as the mouse moves", function() {
                    testPage.dragElementOffsetTo(test.example.element, 20, 0, null, null, function() {
                        expect(test.translate_composer.translateX).toBeGreaterThan(19);
                    });
                });
                it("can be set", function() {
                    test.translate_composer.translateX = 25;
                    expect(test.x).toBe("25px");
                });
            });
            describe("translateY", function() {
                it("updates as the mouse moves", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, 20, null, null, function() {
                        expect(test.translate_composer.translateY).toBeGreaterThan(19);
                    });
                });
                it("can be set", function() {
                    test.translate_composer.translateY = 5;
                    expect(test.y).toBe("5px");
                });
            });
            describe("maxTranslateX", function() {
                it("limits translateX", function() {
                    testPage.dragElementOffsetTo(test.example.element, 500, 0, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).not.toBeGreaterThan(350);
                        });
                    });
                });
            });
            describe("maxTranslateY", function() {
                it ("limits translateY", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, 500, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateY).not.toBeGreaterThan(350);
                        });
                    });
                });
            });

            describe("minTranslateX", function() {
                it ("limits translateX", function() {
                    testPage.dragElementOffsetTo(test.example.element, -500, 0, null, null, function() {
                        expect(test.translate_composer.translateX).not.toBeLessThan(20);
                    });
                });

                it("can be set to null and translateX has no minimum", function() {
                    var old = test.translate_composer.minTranslateX;
                    test.translate_composer.minTranslateX = null;
                    test.translate_composer.translateX = 0;
                    testPage.dragElementOffsetTo(test.example.element, -500, 0, null, null, function() {
                        expect(test.translate_composer.translateX).toBeLessThan(-400);
                        test.translate_composer.minTranslateX = old;
                    });
                });
            });

            describe("minTranslateY", function() {
                it("limits translateY", function() {
                    testPage.dragElementOffsetTo(test.example.element, 0, -500, null, null, function() {
                        expect(test.translate_composer.translateY).not.toBeLessThan(-40);
                    });
                });
            });

            describe("allowFloats", function() {
                it('only allows translate{X|Y} to be ints when false', function() {
                    test.translate_composer.translateX = 100.543;
                    test.translate_composer.translateY = -20.4;
                    expect(test.translate_composer.translateX).toBe(100);
                    expect(test.translate_composer.translateY).toBe(-20);
                });
                it('allows translate{X|Y} to be floats when true', function() {
                    test.translate_composer.allowFloats = true;
                    test.translate_composer.translateX = 100.543;
                    test.translate_composer.translateY = -20.4;
                    expect(test.translate_composer.translateX).toBe(100.543);
                    expect(test.translate_composer.translateY).toBe(-20.4);
                    test.translate_composer.allowFloats = false;
                });
            });

            describe("invertAxis", function() {
                it("causes translation in the opposite direction to pointer movement when true", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.invertAxis = true;

                    testPage.dragElementOffsetTo(test.example.element, -50, -50, null, null, function() {
                        expect(test.translate_composer.translateX).toBeGreaterThan(49);
                        expect(test.translate_composer.translateY).toBeGreaterThan(49);
                        test.translate_composer.invertAxis = false;
                    });
                });
            });

            describe("axis", function() {

                it("limits movement to horizonal when set to 'horizontal'", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.axis = "horizontal";

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).toBeGreaterThan(49);
                            expect(test.translate_composer.translateY).toBe(-40);
                        });
                    });
                });
                it("limits movement to vertical when set to 'vertical'", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.axis = "vertical";

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).toBe(20);
                            expect(test.translate_composer.translateY).toBeGreaterThan(9);
                        });
                    });
                });
                it("does not limit movement when set to an unknown value", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.axis = null;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        runs(function() {
                            expect(test.translate_composer.translateX).toBeGreaterThan(49);
                            expect(test.translate_composer.translateY).toBeGreaterThan(49);
                        });
                    });
                });
            });
            describe("pointerSpeedMultiplier", function() {
                it ("multiplies the translation values by 3 when set to 3", function() {
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;
                    test.translate_composer.invertAxis = false;
                    test.translate_composer.pointerSpeedMultiplier = 3;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.translate_composer.translateX).toBeGreaterThan(149);
                        expect(test.translate_composer.translateY).toBeGreaterThan(149);
                        test.translate_composer.pointerSpeedMultiplier = 1;

                    });
                });
            });
            describe("hasMomentum", function() {
                it("keeps translating after mouse is released", function() {
                    test.translate_composer.hasMomentum = true;
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(test.translate_composer.translateX).toBeGreaterThan(55);
                            expect(test.translate_composer.translateY).toBeGreaterThan(55);
                            test.translate_composer.hasMomentum = false;
                        });
                    });
                });
                it("keeps translating after mouse is released when inverted", function() {
                    test.translate_composer.hasMomentum = true;
                    test.translate_composer.invertAxis = true;
                    test.translate_composer.translateX = 0;
                    test.translate_composer.translateY = 0;

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        waits(100);
                        runs(function(){
                            expect(test.translate_composer.translateX).toBeLessThan(45);
                            expect(test.translate_composer.translateY).toBeLessThan(45);
                            test.translate_composer.hasMomentum = false;
                            test.translate_composer.invertAxis = false;
                        });
                    });
                });
            });
            describe("translate event", function() {
                it ("should not dispatch a translate event by default", function() {
                    spyOn(test, 'handleTranslate').andCallThrough();

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.handleTranslate).not.toHaveBeenCalled();
                    });
                });
                it ("should dispatch a translate event if an object is listening for it", function() {
                    spyOn(test, 'handleTranslate').andCallThrough();
                    test.translate_composer.addEventListener("translate", test.handleTranslate, false);

                    testPage.dragElementOffsetTo(test.example.element, 50, 50, null, null, function() {
                        expect(test.handleTranslate).toHaveBeenCalled();
                    });
                });
            });
        });
    });
});
