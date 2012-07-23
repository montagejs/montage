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
var Montage = require("montage").Montage,
    TestPageLoader = require("support/testpageloader").TestPageLoader,
    Component = require("montage/ui/component").Component,
    Serializer = require("montage/core/serializer").Serializer;

var stripPP = function stripPrettyPrintting(str) {
    return str.replace(/\n\s*/g, "");
};

var testPage = TestPageLoader.queueTest("draw", function() {

    var querySelector = function(s) {
        return testPage.querySelector(s);
    };

    describe("ui/component-spec", function() {
        describe("draw test", function() {
            it("should load", function() {
                expect(testPage.loaded).toBeTruthy();
            });

            it("should use the label as identifier if no identifier is given", function() {
                expect(testPage.test.componentWithoutIdentifier.identifier).toBe("componentWithoutIdentifier");
                expect(testPage.test.componentWithIdentifier.identifier).toBe("anIdentifier");
            });


            describe("originalContent", function() {
                it("should contain the original content of the component markup", function() {
                    var originalContent = testPage.test.repetition.originalContent;
                    expect(originalContent.length).toBe(2);
                    expect(originalContent[0].outerHTML).toBe("<h3>Original Content</h3>");
                    expect(originalContent[1].outerHTML).toBe("<p>here</p>");
                });

                it("should set the original content to the domContent of the component before inserting the template", function() {
                    var componentList = testPage.test.componentList,
                        texts = componentList.element.querySelectorAll("*[data-montage-id='text2']");

                    expect(texts.length).toBe(3);
                });
            });

            describe("domContent", function() {
                it("should contain the current content of the component markup", function() {
                    var content = testPage.test.repetition.domContent;
                    expect(content.length).toBe(6);
                });

                it("should change the content of the component for markup", function() {
                    var componentC = testPage.test.componentC,
                        content = componentC.domContent,
                        newContent = componentC._element.ownerDocument.createElement("div");

                    expect(content.length).toBe(3);
                    newContent.setAttribute("class", "markup");
                    testPage.test.componentC.domContent = newContent;
                    // should only draw at draw cycle.
                    expect(componentC.domContent).toEqual(content);

                    testPage.waitForDraw();

                    runs(function() {
                        expect(componentC.domContent.length).toBe(1);
                        expect(componentC.domContent[0].outerHTML).toBe('<div class="markup"></div>');
                    });
                });

                it("should change the content of the component for another component", function() {
                    var componentC = testPage.test.componentC,
                        componentC1 = testPage.test.componentC1,
                        content = componentC.domContent,
                        newContent = componentC1._element;

                    testPage.test.componentC.domContent = newContent;
                    // should only draw at draw cycle.
                    expect(componentC.domContent).toEqual(content);
                    testPage.waitForDraw();

                    runs(function() {
                        expect(componentC.domContent.length).toBe(1);
                        expect(componentC.domContent[0].outerHTML).toBe('<div data-montage-id="componentC1">C1</div>');
                        expect(componentC.domContent[0].controller).toBe(componentC1);
                    });
                });

                it("should change the content of the component for another component with root elements that are not components themselves", function() {
                    var originalContent = testPage.test.componentD.originalContent,
                        componentDtarget = testPage.test.componentDtarget;

                    componentDtarget.domContent = originalContent;
                    testPage.waitForDraw();
                    runs(function() {
                        expect(componentDtarget._element.innerHTML).toBe("\n    <h1>\n        <div data-montage-id=\"componentD1\">D1</div>\n    </h1>\n");
                    });
                });

                it("should preverve the owner component of transplanted components", function() {
                   var componentLayout = testPage.test.componentLayout; expect(componentLayout.leftComponent.ownerComponent).not.toBe(componentLayout);
                   expect(componentLayout.rightComponent.ownerComponent).not.toBe(componentLayout);
                });
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
                it("should draw children before parents even if the parents are added during willDraw", function() {
                    // Draw the components once so that they are fully loaded, then run the test
                    testPage.test.componentDrawsParent.needsDraw = true;
                    testPage.test.componentParent.parentHasDrawn = false;

                    spyOn(testPage.test.componentDrawsParent, 'willDraw').andCallFake(function() {
                        testPage.test.componentDrawsParent.parentComponent.needsDraw = true;
                    });

                    spyOn(testPage.test.componentParent, 'draw').andCallFake(function() {
                        testPage.test.componentParent.parentHasDrawn = true;
                    });

                    spyOn(testPage.test.componentDrawsParent, 'draw').andCallFake(function() {
                        expect(testPage.test.componentParent.parentHasDrawn).toBeFalsy();
                    });

                    testPage.waitForDraw();
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

                it("should draw a component that was assigned an element not part of the DOM tree when it's added to the DOM tree", function() {
                    var component = testPage.test.componentNoelement,
                        element = component.element;

                    testPage.window.document.body.appendChild(element);
                    component.needsDraw = true;

                    testPage.waitForDraw();
                    runs(function() {
                        expect(element.textContent).toBe(component.value);
                    });
                });

                it("should correctly append styles attributes", function() {
                   var style = testPage.test.componentStyle.element.getAttribute("style");

                   expect(style).toBe("border: 1px solid black; margin: 2px");
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

            describe("the component tree", function() {
                it("should reorganize the component tree when a new component is added", function() {
                    var Component = testPage.window.require("montage/ui/component").Component,
                        componentE1 = Component.create(),
                        element = testPage.window.document.getElementById("componentE1");

                    componentE1.hasTemplate = false;
                    componentE1.element = element;
                    componentE1.attachToParentComponent();
                    expect(testPage.test.componentE.childComponents.length).toBe(1);
                    expect(testPage.test.componentE.childComponents[0]).toBe(componentE1);
                    expect(componentE1.childComponents.length).toBe(1);
                    expect(componentE1.childComponents[0]).toBe(testPage.test.componentE11);
                });
            });

            describe("the owner component property", function() {
                var Component = testPage.window.require("montage/ui/component").Component;
                var componentOwner = testPage.test.componentOwner;

                var leaf1 = componentOwner.leaf1;
                var leaf2 = componentOwner.leaf2;
                var branch = componentOwner.branch;
                var branchLeaf1 = branch.leaf1;
                var branchLeaf2 = branch.leaf2;

                it("should be the component that loaded the template", function() {
                    expect(leaf1.ownerComponent).toBe(componentOwner);
                    expect(leaf2.ownerComponent).toBe(componentOwner);
                    expect(branch.ownerComponent).toBe(componentOwner);
                    expect(branchLeaf1.ownerComponent).toBe(branch);
                    expect(branchLeaf2.ownerComponent).toBe(branch);
                });
            });

            it("should be able to draw a component after being cleaned up", function() {
                testPage.test.componentToBeCleaned.cleanupDeletedComponentTree();
                testPage.test.componentToBeCleaned.text.value = "New Text";

                testPage.waitForDraw();
                runs(function() {
                    expect(testPage.test.componentToBeCleaned.text._element.textContent).toBe("New Text");
                })
            })

        });

        it("does not allow the element to be changed", function() {
            var oldElement = testPage.test.text1.element;
            testPage.test.text1.element = testPage.document.createElement("div");
            expect(testPage.test.text1.element).toBe(oldElement);
        });

        it("should serialize delegate as a reference", function() {
            var serializer = Serializer.create().initWithRequire(require),
                serialization = serializer.serializeObject(testPage.test.componentWithDelegate);

            expect(stripPP(serialization)).toBe('{"root":{"prototype":"montage/ui/component","properties":{"delegate":{"@":"application"},"parentProperty":"parentComponent","identifier":"componentWithDelegate"}},"application":{}}');
        });

        it("should have templateObjects object", function() {
            expect(testPage.test.componentOwner.templateObjects).not.toBeNull();
        });

        it("should maintain the placeholder data-montage-id and not the one from the template", function() {
           var element = testPage.test.componentList.element;

           expect(element.getAttribute("data-montage-id")).toBe("componentList");
        });

        it("should maintain the placeholder id and not the one from the template", function() {
           var element = testPage.test.componentList.element;

           expect(element.getAttribute("id")).toBe("componentList");
        });
    });
});
