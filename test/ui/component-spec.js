/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    Component = require("montage/ui/component").Component;

var testPage = TestPageLoader.queueTest("draw", function() {

    describe("ui/component-spec", function() {
        describe("draw test", function() {
            it("should load", function() {
                expect(testPage.loaded).toBeTruthy();
            });

            describe("calling willDraw prior to drawing", function() {

                beforeEach(function() {
                    expect(testPage.test).toBeDefined();
                    testPage.test.loadComponents();
                });

                it("should have access to DOM metrics during willDraw", function() {
                    var documentElement = testPage.iframe.contentDocument.documentElement;
                    var offsetHeight = 0;

                    spyOn(testPage.test.componentA, 'willDraw').andCallFake(function() {
                        offsetHeight = documentElement.offsetHeight;
                    })();

                    testPage.test.componentA.needsDraw = true;
                    testPage.waitForDraw();

                    runs(function() {
                        expect(offsetHeight).not.toBe(0);
                    });
                });
                it("should draw children in the same cycle that are added during parent's willDraw", function() {

                    // Draw the components once so that they are loaded, then run the test
                    testPage.test.componentB.needsDraw = true;
                    testPage.test.componentB1.needsDraw = true;

                    testPage.waitForDraw();

                    runs(function() {
                        spyOn(testPage.test.componentB, 'willDraw').andCallFake(function() {
                            testPage.test.componentB1.needsDraw = true;
                        })
                        spyOn(testPage.test.componentB1, 'draw').andCallThrough();
                        // trigger test
                        testPage.test.componentB.needsDraw = true;
                         // wait for draw
                        testPage.waitForDraw();
                        // test results
                        runs(function() {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                        });
                    });
                });
                it("should draw components in the same cycle that are added during a willDraw", function() {

                    // Draw the components once so that they are fully loaded, then run the test
                    testPage.test.componentB.needsDraw = true;
                    testPage.test.componentB1.needsDraw = true;
                    testPage.test.componentA.needsDraw = true;
                    testPage.test.componentA1.needsDraw = true;

                    testPage.waitForDraw();

                    runs(function() {
                        spyOn(testPage.test.componentB, 'willDraw').andCallFake(function() {
                            testPage.test.componentB1.needsDraw = true;
                        });
                        spyOn(testPage.test.componentB1, 'willDraw').andCallFake(function() {
                            testPage.test.componentA.needsDraw = true;
                        });
                        spyOn(testPage.test.componentA, 'willDraw').andCallFake(function() {
                            testPage.test.componentA1.needsDraw = true;
                        });
                        spyOn(testPage.test.componentB1, 'draw').andCallThrough();
                        spyOn(testPage.test.componentA1, 'draw').andCallThrough();
                        spyOn(testPage.test.componentA, 'draw').andCallThrough();
                        // trigger test
                        testPage.test.componentB.needsDraw = true;
                         // wait for draw
                        testPage.waitForDraw();
                        // test results
                        runs(function() {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                            expect(testPage.test.componentA.draw).toHaveBeenCalled();
                            expect(testPage.test.componentA1.draw).toHaveBeenCalled();
                        });
                    });
                });
            });

            describe("component drawing", function() {
                beforeEach(function() {
                    testPage.test.loadComponents();
                });
                it("should draw after needsDraw is called", function() {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').andCallThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw();
                    // test results
                    runs(function() {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                    });
                });
                it("should draw after needsDraw is called again", function() {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').andCallThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw();
                    // test results
                    runs(function() {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                    });
                });
                it("should draw parent and child when parent is called last", function() {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').andCallThrough();
                    spyOn(testPage.test.componentA1, 'draw').andCallThrough();
                    // trigger test
                    testPage.test.componentA1.needsDraw = true;
                    testPage.test.componentA.needsDraw = true;
                    /// wait for draw
                    testPage.waitForDraw();
                    // test results
                    runs(function() {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                        expect(testPage.test.componentA1.draw).toHaveBeenCalled();
                    });
                });
                it("shouldn't draw child if parent can't", function() {
                    // setup spies
                    spyOn(testPage.test.componentA, 'canDraw').andReturn(false);
                    spyOn(testPage.test.componentA1, 'draw').andCallThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    testPage.test.componentA1.needsDraw = true;
                    /// wait for draw
                    testPage.waitForDraw();
                    // test results
                    runs(function() {
                        expect(testPage.test.componentA1.draw).not.toHaveBeenCalled();
                    });
                });
                it("should draw children in an additional cycle that are added during parent's draw", function() {
                    // setup spies
                    spyOn(testPage.test.componentB, 'draw').andCallFake(function() {
                        testPage.test.componentB1.needsDraw = true;
                    });
                    spyOn(testPage.test.componentB1, 'draw').andCallThrough();
                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw();
                    // test results
                    runs(function() {
                        expect(testPage.test.componentB.draw).toHaveBeenCalled();
                        expect(testPage.test.componentB1.draw).not.toHaveBeenCalled();

                        testPage.waitForDraw();

                        runs(function() {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                        });
                    });
                });
                it("should schedule an additional draw if needsDraw is set during draw", function() {
                    var count = 0;

                    spyOn(testPage.test.componentB, 'draw').andCallFake(function() {
                        if (count == 0) {
                            testPage.test.componentB.needsDraw = true;
                        }
                        count++;
                    });

                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw();

                    // test results
                    runs(function() {
                        expect(testPage.test.componentB.draw).toHaveBeenCalled();
                        testPage.waitForDraw();
                        runs(function() {
                            // Really just needs the waitForDraw to complete since componentB.draw has already been called
                            expect(testPage.test.componentB.draw).toHaveBeenCalled();
                        });
                    });
                });
            });

            describe("didDraw calling after draw", function() {
                beforeEach(function() {
                    testPage.test.loadComponents();
                });
                it("should call didDraw after draw", function() {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').andCallThrough();
                    spyOn(testPage.test.componentA, 'didDraw').andCallThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw();
                    // test results
                    runs(function() {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                        expect(testPage.test.componentA.didDraw).toHaveBeenCalled();
                    });
                });
                it("should call didDraw after draw only if draw was called", function() {
                    // setup spies
                    spyOn(testPage.test.componentB, 'draw').andCallThrough();
                    spyOn(testPage.test.componentB, 'didDraw').andCallThrough();
                    spyOn(testPage.test.componentB1, 'canDraw').andReturn(false);
                    spyOn(testPage.test.componentB1, 'draw').andCallThrough();
                    spyOn(testPage.test.componentB1, 'didDraw').andCallThrough();
                    spyOn(testPage.test.componentB2, 'draw').andCallThrough();
                    spyOn(testPage.test.componentB2, 'didDraw').andCallThrough();
                    // trigger test
                    testPage.test.componentB.allowsPartialDraw = true;
                    testPage.test.componentB.needsDraw = true;
                    testPage.test.componentB1.needsDraw = true;
                    testPage.test.componentB2.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw();
                    // test results
                    runs(function() {
                        expect(testPage.test.componentB.didDraw).toHaveBeenCalled();
                        expect(testPage.test.componentB1.didDraw).not.toHaveBeenCalled();
                        expect(testPage.test.componentB2.didDraw).toHaveBeenCalled();
                    });
                });
                it("should receive a first draw event after its first draw", function() {
                    testPage.test.componentB1.addEventListener("firstDraw", testPage.test.componentB1, false);
                    testPage.test.componentB.addEventListener("firstDraw", testPage.test.componentB, false);

                    spyOn(testPage.test.componentB, 'willDraw').andCallFake(function() {
                        testPage.test.componentB1.needsDraw = true;
                    });

                    spyOn(testPage.test.componentB1, 'handleFirstDraw').andCallThrough();
                    spyOn(testPage.test.componentB1, 'draw').andCallThrough();
                    spyOn(testPage.test.componentB, 'handleFirstDraw').andCallThrough();

                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw();

                    // test results
                    runs(function() {
                        expect(testPage.test.componentB.handleFirstDraw).toHaveBeenCalled();
                        expect(testPage.test.componentB1.handleFirstDraw).not.toHaveBeenCalled();

                        testPage.waitForDraw();
                        runs(function() {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                            expect(testPage.test.componentB1.handleFirstDraw).toHaveBeenCalled();
                        });
                    });
                });
                it("should not receive a first draw event on subsequent draws", function() {
                    testPage.test.componentB.addEventListener("firstDraw", testPage.test.componentB, false);
                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw();

                    // test results
                    runs(function() {
                        spyOn(testPage.test.componentB, 'draw').andCallThrough();
                        spyOn(testPage.test.componentB, 'handleFirstDraw').andCallThrough();

                        testPage.test.componentB.needsDraw = true;

                        testPage.waitForDraw();
                        runs(function() {
                            expect(testPage.test.componentB.draw).toHaveBeenCalled();
                            expect(testPage.test.componentB.handleFirstDraw).not.toHaveBeenCalled();
                        });
                    });
                });
                it("should have access to DOM metrics during didDraw", function() {
                    var documentElement = testPage.iframe.contentDocument.documentElement;
                    var offsetHeight = 0;

                    spyOn(testPage.test.componentA, 'didDraw').andCallFake(function() {
                        offsetHeight = documentElement.offsetHeight;
                    })();

                    testPage.test.componentA.needsDraw = true;
                    testPage.waitForDraw();

                    runs(function() {
                        expect(offsetHeight).not.toBe(0);
                    });
                });
            });
        });
    });
});
