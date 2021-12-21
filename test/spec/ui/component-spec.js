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
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Component = require("montage/ui/component").Component,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer,
    Template = require("montage/core/template").Template,
    DocumentPart = require("montage/core/document-part").DocumentPart,
    Alias = require("montage/core/serialization/alias").Alias;
var Bindings = require("montage/core/core").Bindings;
var MockDOM = require("mocks/dom");

TestPageLoader.queueTest("draw/draw", function (testPage) {
    var test;

    var querySelector = function (s) {
        return testPage.querySelector(s);
    };

    beforeEach(function () {
        test = testPage.test;
    });

    describe("ui/component-spec", function () {
        describe("draw test", function () {
            it("should use the label as identifier if no identifier is given", function () {
                expect(testPage.test.componentWithoutIdentifier.identifier).toBe("componentWithoutIdentifier");
                expect(testPage.test.componentWithIdentifier.identifier).toBe("anIdentifier");
            });

            describe("innerTemplate", function () {
                it("should be a template with the contents of the element", function () {
                    var innerTemplate = testPage.test.repetition.innerTemplate,
                        childNodes = innerTemplate.document.body.childNodes;

                    expect(childNodes.length).toBe(2);
                    expect(childNodes[0].outerHTML).toBe("<h3>Original Content</h3>");
                    expect(childNodes[1].outerHTML).toBe("<p>here</p>");
                });
            });

            describe("domContent", function () {
                it("should contain the current content of the component markup", function () {
                    var content = testPage.test.componentC.domContent;

                    expect(content.length).toBe(3);
                });

                it("should change the content of the component for markup part1", function (done) {
                    var componentC = testPage.test.componentC,
                        content = componentC.domContent,
                        newContent = componentC._element.ownerDocument.createElement("div");

                    newContent.setAttribute("class", "markup");
                    testPage.test.componentC.domContent = newContent;
                    // should only draw at draw cycle.
                    expect(componentC.domContent).toEqual(content);

                    testPage.waitForComponentDraw(componentC).then(function () {
                        expect(componentC.domContent.length).toBe(1);
                        expect(componentC.domContent[0].outerHTML).toBe('<div class="markup"></div>');
                        done();
                    });
               });

                it("should change the content of the component for another component part1", function (done) {
                    var componentC = testPage.test.componentC,
                        componentC1 = testPage.test.componentC1,
                        content = componentC.domContent,
                        newContent = componentC1._element;

                    testPage.test.componentC.domContent = newContent;
                    // should only draw at draw cycle.
                    expect(componentC.domContent).toEqual(content);

                    var componentC = testPage.test.componentC,
                        componentC1 = testPage.test.componentC1;
                    testPage.waitForComponentDraw(componentC).then(function () {
                        expect(componentC.domContent.length).toBe(1);
                        expect(componentC.domContent[0].outerHTML).toBe('<div data-montage-id="componentC1">C1</div>');
                        expect(componentC.domContent[0].component).toBe(componentC1);
                        done();
                    });
                });

                it("should change the content of the component for another component with root elements that are not components themselves", function (done) {
                    var domContent = testPage.test.componentD.domContent,
                        componentDtarget = testPage.test.componentDtarget;

                    componentDtarget.domContent = domContent;
                    testPage.waitForDraw().then(function () {
                        expect(componentDtarget._element.innerHTML).toBe("\n    <h1>\n        <div data-montage-id=\"componentD1\">D1</div>\n    </h1>\n");
                        done();
                    });
                });

                it("should preverve the owner component of transplanted components", function () {
                   var componentLayout = testPage.test.componentLayout; expect(componentLayout.leftComponent.ownerComponent).not.toBe(componentLayout);
                   expect(componentLayout.rightComponent.ownerComponent).not.toBe(componentLayout);
                });

                it("should correct the parent component's drawList of transplanted components", function () {
                    var componentLayout = testPage.test.componentLayout,
                        rightComponent = componentLayout.rightComponent,
                        right = componentLayout.templateObjects.right,
                        center = componentLayout.templateObjects.center;

                    rightComponent.needsDraw = true;
                    expect(right._drawList.length).toBe(1);

                    center.domContent = right.domContent;
                    expect(right._drawList.length).toBe(0);
                });

            });

            describe("calling willDraw prior to drawing", function () {

                beforeEach(function () {
                    expect(testPage.test).toBeDefined();
                    testPage.test.loadComponents();
                });

                it("should have access to DOM metrics during willDraw", function (done) {
                    var documentElement = testPage.iframe.contentDocument.documentElement;
                    var offsetHeight = 0;

                    spyOn(testPage.test.componentA, 'willDraw').and.callFake(function () {
                        offsetHeight = documentElement.offsetHeight;
                    })();

                    testPage.test.componentA.needsDraw = true;
                    testPage.waitForDraw().then(function () {
                        expect(offsetHeight).not.toBe(0);
                        done();
                    });
                });
                it("should draw children in the same cycle that are added during parent's willDraw", function (done) {

                    // Draw the components once so that they are loaded, then run the test
                    testPage.test.componentB.needsDraw = true;
                    testPage.test.componentB1.needsDraw = true;

                    testPage.waitForDraw().then(function () {
                        spyOn(testPage.test.componentB, 'willDraw').and.callFake(function () {
                            testPage.test.componentB1.needsDraw = true;
                        });
                        spyOn(testPage.test.componentB1, 'draw').and.callThrough();
                        // trigger test
                        testPage.test.componentB.needsDraw = true;
                         // wait for draw
                        testPage.waitForDraw().then(function () {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                            done();
                        });
                    });
                });
                it("should draw components in the same cycle that are added during a willDraw", function (done) {

                    // Draw the components once so that they are fully loaded, then run the test
                    testPage.test.componentB.needsDraw = true;
                    testPage.test.componentB1.needsDraw = true;
                    testPage.test.componentA.needsDraw = true;
                    testPage.test.componentA1.needsDraw = true;

                    testPage.waitForDraw().then(function () {
                        spyOn(testPage.test.componentB, 'willDraw').and.callFake(function () {
                            testPage.test.componentB1.needsDraw = true;
                        });
                        spyOn(testPage.test.componentB1, 'willDraw').and.callFake(function () {
                            testPage.test.componentA.needsDraw = true;
                        });
                        spyOn(testPage.test.componentA, 'willDraw').and.callFake(function () {
                            testPage.test.componentA1.needsDraw = true;
                        });
                        spyOn(testPage.test.componentB1, 'draw').and.callThrough();
                        spyOn(testPage.test.componentA1, 'draw').and.callThrough();
                        spyOn(testPage.test.componentA, 'draw').and.callThrough();
                        // trigger test
                        testPage.test.componentB.needsDraw = true;
                         // wait for draw
                        testPage.waitForDraw().then(function () {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                            expect(testPage.test.componentA.draw).toHaveBeenCalled();
                            expect(testPage.test.componentA1.draw).toHaveBeenCalled();
                            done();
                        });
                    });
                });
                it("should draw children before parents even if the parents are added during willDraw", function (done) {
                    // Draw the components once so that they are fully loaded, then run the test
                    testPage.test.componentDrawsParent.needsDraw = true;
                    testPage.test.componentParent.parentHasDrawn = false;

                    spyOn(testPage.test.componentDrawsParent, 'willDraw').and.callFake(function () {
                        testPage.test.componentDrawsParent.parentComponent.needsDraw = true;
                    });

                    spyOn(testPage.test.componentParent, 'draw').and.callFake(function () {
                        testPage.test.componentParent.parentHasDrawn = true;
                    });

                    spyOn(testPage.test.componentDrawsParent, 'draw').and.callFake(function () {
                        expect(testPage.test.componentParent.parentHasDrawn).toBeFalsy();
                    });

                    testPage.waitForDraw().then(function () {
                        done();
                    });
                });
            });

            describe("component drawing", function () {
                beforeEach(function () {
                    testPage.test.loadComponents();
                });
                it("should draw after needsDraw is called", function (done) {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').and.callThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                        done();
                    });
                });
                it("should draw after needsDraw is called again", function (done) {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').and.callThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                        done();
                    });
                });
                it("should draw parent and child when parent is called last", function (done) {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').and.callThrough();
                    spyOn(testPage.test.componentA1, 'draw').and.callThrough();
                    // trigger test
                    testPage.test.componentA1.needsDraw = true;
                    testPage.test.componentA.needsDraw = true;
                    /// wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                        expect(testPage.test.componentA1.draw).toHaveBeenCalled();
                        done();
                    });
                });
                it("shouldn't draw child if parent can't", function (done) {
                    // setup spies
                    spyOn(testPage.test.componentA, 'canDraw').and.returnValue(false);
                    spyOn(testPage.test.componentA1, 'draw').and.callThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    testPage.test.componentA1.needsDraw = true;
                    /// wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentA1.draw).not.toHaveBeenCalled();
                        done();
                    });
                });

                xit("should draw children in an additional cycle that are added during parent's draw", function (done) {
                    // TODO: we can't make this working at the moment because
                    // enter/exitDocument is implemented by forcing a draw
                    // setup spies
                    spyOn(testPage.test.componentB, 'draw').and.callFake(function () {
                        testPage.test.componentB1.needsDraw = true;
                    });
                    spyOn(testPage.test.componentB1, 'draw').and.callThrough();
                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentB.draw).toHaveBeenCalled();
                        expect(testPage.test.componentB1.draw).not.toHaveBeenCalled();

                        testPage.waitForDraw().then(function () {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                            done();
                        });
                    });
                });
                it("should schedule an additional draw if needsDraw is set during draw", function (done) {
                    var count = 0;

                    spyOn(testPage.test.componentB, 'draw').and.callFake(function () {
                        if (count == 0) {
                            testPage.test.componentB.needsDraw = true;
                        }
                        count++;
                    });

                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentB.draw).toHaveBeenCalled();
                        testPage.waitForDraw().then(function () {
                            // Really just needs the waitForDraw to complete since componentB.draw has already been called
                            expect(testPage.test.componentB.draw).toHaveBeenCalled();
                            done();
                        });
                    });
                });

                it("should draw a component that was assigned an element not part of the DOM tree when it's added to the DOM tree", function (done) {
                    var component = testPage.test.componentNoelement,
                        element = component.element;

                    testPage.global.document.body.appendChild(element);
                    component.attachToParentComponent();
                    component.needsDraw = true;

                    testPage.waitForDraw().then(function () {
                        expect(element.textContent).toBe(component.value);
                        done();
                    });
                });

                it("should correctly append styles attributes", function () {
                   var style = testPage.test.componentStyle.element.getAttribute("style");

                   expect(style).toBe("border: 1px solid black; margin: 2px");
                });

                it("should correctly merge attributes without leading or trailing whitespaces", function () {
                    var element = testPage.test.componentStyle.element;

                    expect(element.getAttribute("data-element-attr")).toBe("element");
                    expect(element.getAttribute("data-template-attr")).toBe("template");
                });

                describe("_blocksOwnerComponentDraw", function () {
                    it("should stop the owner from drawing when the component can't", function (done) {
                        // setup spies
                        spyOn(testPage.test.componentH, 'draw').and.callThrough();
                        // trigger test
                        testPage.test.componentH.needsDraw = true;
                        testPage.test.componentH1.canDrawGate.setField("field", false);
                        /// wait for draw
                        testPage.waitForDraw().then(function () {
                            expect(testPage.test.componentH.draw).not.toHaveBeenCalled();
                            testPage.test.componentH1.canDrawGate.setField("field", true);
                            done();
                        });
                    });

                    it("should continue drawing when the component can", function (done) {
                        // setup spies
                        spyOn(testPage.test.componentH, 'draw').and.callThrough();
                        // trigger test
                        testPage.test.componentH.needsDraw = true;
                        testPage.test.componentH1.canDrawGate.setField("field", false);
                        /// wait for draw
                        testPage.waitForDraw().then(function () {
                            testPage.test.componentH1.canDrawGate.setField("field", true);
                            testPage.waitForDraw().then(function () {
                                expect(testPage.test.componentH.draw).toHaveBeenCalled();
                                done();
                            });
                        });
                    });

                    it("should continue drawing even if the owner component doesn't need to draw", function (done) {
                        // setup spies
                        spyOn(testPage.test.componentH1, 'draw').and.callThrough();
                        // trigger test
                        testPage.test.componentH1.needsDraw = true;
                        testPage.test.componentH1.canDrawGate.setField("field", false);

                        /// wait for draw
                        testPage.waitForDraw().then(function () {
                            expect(testPage.test.componentH1.draw).not.toHaveBeenCalled();
                            testPage.test.componentH1.canDrawGate.setField("field", true);
                            testPage.waitForDraw().then(function () {
                                expect(testPage.test.componentH1.draw).toHaveBeenCalled();
                                done();
                            })
                        });
                    });
                });
            });

            describe("didDraw calling after draw", function () {
                beforeEach(function () {
                    testPage.test.loadComponents();
                });
                it("should call didDraw after draw", function (done) {
                    // setup spies
                    spyOn(testPage.test.componentA, 'draw').and.callThrough();
                    spyOn(testPage.test.componentA, 'didDraw').and.callThrough();
                    // trigger test
                    testPage.test.componentA.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentA.draw).toHaveBeenCalled();
                        expect(testPage.test.componentA.didDraw).toHaveBeenCalled();
                        done();
                    });
                });
                it("should call didDraw after draw only if draw was called", function (done) {
                    // setup spies
                    spyOn(testPage.test.componentB, 'draw').and.callThrough();
                    spyOn(testPage.test.componentB, 'didDraw').and.callThrough();
                    spyOn(testPage.test.componentB1, 'canDraw').and.returnValue(false);
                    spyOn(testPage.test.componentB1, 'draw').and.callThrough();
                    spyOn(testPage.test.componentB1, 'didDraw').and.callThrough();
                    spyOn(testPage.test.componentB2, 'draw').and.callThrough();
                    spyOn(testPage.test.componentB2, 'didDraw').and.callThrough();
                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                    testPage.test.componentB1.needsDraw = true;
                    testPage.test.componentB2.needsDraw = true;
                    // wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentB.didDraw).toHaveBeenCalled();
                        expect(testPage.test.componentB1.didDraw).not.toHaveBeenCalled();
                        expect(testPage.test.componentB2.didDraw).toHaveBeenCalled();
                        done();
                    });
                });

                xit("should receive a first draw event after its first draw", function (done) {
                    // TODO: we can't make this working at the moment because
                    // enter/exitDocument is implemented by forcing a draw
                    testPage.test.componentB1.addEventListener("firstDraw", testPage.test.componentB1, false);
                    testPage.test.componentB.addEventListener("firstDraw", testPage.test.componentB, false);

                    spyOn(testPage.test.componentB, 'willDraw').and.callFake(function () {
                        testPage.test.componentB1.needsDraw = true;
                    });

                    spyOn(testPage.test.componentB1, 'handleFirstDraw').and.callThrough();
                    spyOn(testPage.test.componentB1, 'draw').and.callThrough();
                    spyOn(testPage.test.componentB, 'handleFirstDraw').and.callThrough();

                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw().then(function () {
                        expect(testPage.test.componentB.handleFirstDraw).toHaveBeenCalled();
                        expect(testPage.test.componentB1.handleFirstDraw).not.toHaveBeenCalled();

                        testPage.waitForDraw().then(function () {
                            expect(testPage.test.componentB1.draw).toHaveBeenCalled();
                            expect(testPage.test.componentB1.handleFirstDraw).toHaveBeenCalled();
                            done();
                        });
                    });
                });
                it("should not receive a first draw event on subsequent draws", function (done) {
                    testPage.test.componentB.addEventListener("firstDraw", testPage.test.componentB, false);
                    // trigger test
                    testPage.test.componentB.needsDraw = true;
                     // wait for draw
                    testPage.waitForDraw().then(function () {
                        spyOn(testPage.test.componentB, 'draw').and.callThrough();
                        spyOn(testPage.test.componentB, 'handleFirstDraw').and.callThrough();

                        testPage.test.componentB.needsDraw = true;

                        testPage.waitForDraw().then(function () {
                            expect(testPage.test.componentB.draw).toHaveBeenCalled();
                            expect(testPage.test.componentB.handleFirstDraw).not.toHaveBeenCalled();
                            done();
                        });
                    });
                });
                it("should have access to DOM metrics during didDraw", function (done) {
                    var documentElement = testPage.iframe.contentDocument.documentElement;
                    var offsetHeight = 0;

                    spyOn(testPage.test.componentA, 'didDraw').and.callFake(function () {
                        offsetHeight = documentElement.offsetHeight;
                    })();

                    testPage.test.componentA.needsDraw = true;
                    testPage.waitForDraw().then(function () {
                        expect(offsetHeight).not.toBe(0);
                        done();
                    });
                });
            });

            describe("the component tree", function () {
                xit("should reorganize the component tree when a new component is added", function (done) {

                    var componentE1 = new Component(),
                        element = testPage.global.document.getElementById("componentE1");

                    componentE1.hasTemplate = false;
                    componentE1.element = element;
                    componentE1.attachToParentComponent();

                    expect(testPage.test.componentE.childComponents.length).toBe(1);
                    expect(testPage.test.componentE.childComponents[0]).toBe(componentE1);
                    expect(componentE1.childComponents.length).toBe(1);
                    expect(componentE1.childComponents[0]).toBe(testPage.test.componentE11);
                });

                it("should remove a component from its previous parent component childComponent's when it is reattached in another part of the component tree", function () {
                    var componentF = testPage.test.componentF,
                        componentF1 = testPage.test.componentF1,
                        componentG = testPage.test.componentG,
                        element = componentF1.element;

                    element.parentNode.removeChild(element);
                    componentG.element.appendChild(element);

                    componentF1.attachToParentComponent();

                    expect(componentF.childComponents).not.toContain(componentF1);
                });
            });

            describe("the owner component property", function () {
                it("should be the component that loaded the template", function () {
                    var componentOwner = testPage.test.componentOwner;

                    var leaf1 = componentOwner.leaf1;
                    var leaf2 = componentOwner.leaf2;
                    var branch = componentOwner.branch;
                    var branchLeaf1 = branch.leaf1;
                    var branchLeaf2 = branch.leaf2;
                    expect(leaf1.ownerComponent).toBe(componentOwner);
                    expect(leaf2.ownerComponent).toBe(componentOwner);
                    expect(branch.ownerComponent).toBe(componentOwner);
                    expect(branchLeaf1.ownerComponent).toBe(branch);
                    expect(branchLeaf2.ownerComponent).toBe(branch);
                });
            });

            it("should be able to draw a component after being cleaned up", function (done) {
                testPage.test.componentToBeCleaned.cleanupDeletedComponentTree();
                testPage.test.componentToBeCleaned.text.value = "New Text";

                testPage.waitForDraw().then(function () {
                    expect(testPage.test.componentToBeCleaned.text._element.textContent).toBe("New Text");
                    done();
                });
            });

        });

        it("does not allow the element to be changed", function () {
            var oldElement = testPage.test.text1.element;
            testPage.test.text1.element = testPage.document.createElement("div");
            expect(testPage.test.text1.element).toBe(oldElement);
        });

        it("does not allow an element to be assigned to two components", function () {
            var element = testPage.test.text1.element;
            var component = new Component();

            expect(function () {
                component.element = element;
            }).toThrow();
        });

        describe("template objects", function () {
            var templateObjectsComponent;
            beforeEach(function () {
                templateObjectsComponent = testPage.test.templateObjects;
            });
            it("should have templateObjects object", function () {
                expect(templateObjectsComponent.templateObjects).not.toBeNull();
            });

            it("should have templateObjects ready at templateDidLoad", function () {
                expect(templateObjectsComponent.templateObjectsPresent).toBeTruthy();
            });

            it("should have a reference to owner", function () {
                expect(templateObjectsComponent.templateObjects.owner).toBe(templateObjectsComponent);
            });

            it("should have a reference to an object", function () {
                expect(templateObjectsComponent.templateObjects.object).toEqual({});
            });

            it("should have a reference to a component", function () {
                var text = templateObjectsComponent.element.querySelector(".text").component;

                expect(templateObjectsComponent.templateObjects.text).toBe(text);
            });
        });

        it("should maintain the placeholder data-montage-id and not the one from the template", function () {
           var element = testPage.test.componentList.element;

           expect(element.getAttribute("data-montage-id")).toBe("componentList");
        });

        it("should maintain the placeholder id and not the one from the template", function () {
           var element = testPage.test.componentList.element;

           expect(element.getAttribute("id")).toBe("componentList");
        });

        describe("_makeTemplateObjectGetter", function () {
            it("returns a single component", function () {
                var a = {};
                var owner = {
                    querySelectorAllComponent: function () {
                        return [a];
                    }
                };
                a.parentComponent = owner;

                var getter = Component.prototype._makeTemplateObjectGetter(owner, "test");

                expect(getter()).toEqual(a);
                expect(getter()).toEqual(a);
            });

            it("returns all repeated components", function () {
                var a = {};
                var b = {};
                var owner = {
                    querySelectorAllComponent: function () {
                        return [a, b];
                    }
                };
                a.parentComponent = owner;
                b.parentComponent = owner;

                var getter = Component.prototype._makeTemplateObjectGetter(owner, "test");

                expect(getter()).toEqual([a, b]);
                expect(getter()).toEqual([a, b]);
            });
        });

        describe("dom arguments", function () {
            it("should have dom arguments", function () {
                var component = testPage.test.arguments1,
                    names = component.getDomArgumentNames();

                expect(names.length).toBe(2);
                expect(names).toContain("one");
                expect(names).toContain("two");
            });

            it("should have no dom arguments", function () {
                var component = testPage.test.noArguments,
                    names = component.getDomArgumentNames();

                expect(names.length).toBe(0);
            });

            it("should have the correct dom arguments", function () {
                var component = testPage.test.arguments1,
                    one,
                    two;

                one = component.extractDomArgument("one");
                expect(one.className).toBe("one");

                two = component.extractDomArgument("two");
                expect(two.className).toBe("two");
            });

            it("should have dom arguments removed from the DOM", function () {
                var component = testPage.test.arguments2,
                    domArguments = component._domArguments;

                expect(domArguments.one.parentNode).toBe(null);
                expect(domArguments.two.parentNode).toBe(null);
            });

            it("should remove the data argument attribute from the element", function () {
                var component = testPage.test.arguments2,
                    domArguments = component._domArguments;

                expect(domArguments.one.hasAttribute(Component.DOM_ARG_ATTRIBUTE)).toBe(false);
            });

            it("should extract the DOM arguments from the component", function () {
                var component = testPage.test.arguments2,
                    one;

                one = component.extractDomArgument("one");
                expect(one).toBeDefined();
                one = component.extractDomArgument("one");
                expect(one).toBe(null);
            });

            it("should have dom arguments of the component only and not of nested components", function () {
                var component = testPage.test.nestedArguments,
                    names = component.getDomArgumentNames();

                expect(names.length).toBe(2);
            });

            it("should have correct DOM arguments even when they're wrapped by elements", function () {
                var component = testPage.test.wrappedArguments,
                    one;

                one = component.extractDomArgument("one");
                expect(one).toBeDefined();
            });

            it("should satisfy the star parameter when no arguments are given", function () {
                var templateArguments = {

                    },
                    templateParameters = {
                        "*": document.createElement("div")
                    },
                    validation;

                validation = Component.prototype._validateTemplateArguments(
                    templateArguments, templateParameters);
                expect(validation).toBeUndefined();
            });

            it("should fail when an argument is given and no named parameter is defined", function () {
                var templateArguments = {
                        "right": document.createElement("div")
                    },
                    templateParameters = {
                        "*": document.createElement("div")
                    },
                    validation;

                validation = Component.prototype._validateTemplateArguments(
                    templateArguments, templateParameters);
                expect(validation).toBeDefined();
            });

            it("should not fail when no arguments are given and named parameters are not satisfied", function () {
                var templateArguments = {
                    },
                    templateParameters = {
                        "right": document.createElement("div")
                    },
                    validation;

                validation = Component.prototype._validateTemplateArguments(
                    templateArguments, templateParameters);
                expect(validation).not.toBeDefined();
            });

            it("should fail when a named parameters is within an element within a star parameter", function () {
                var star = document.createElement("div"),
                    named = document.createElement("div");

                star.appendChild(named);

                var templateParameters = {
                        "*": star,
                        "named": named
                    },
                    validation;

                validation = Component.prototype._validateTemplateArguments({}, templateParameters);
                expect(validation).toBeDefined();
            });

            it("should not fail when some parameter are not satisfied", function () {
                var templateArguments = {
                        "right": document.createElement("div")
                    },
                    templateParameters = {
                        "right": document.createElement("div"),
                        "center": document.createElement("div")
                    },
                    validation;

                validation = Component.prototype._validateTemplateArguments(
                    templateArguments, templateParameters);
                expect(validation).not.toBeDefined();
            });

            it("should fail when a parameter does not exist", function () {
                var templateArguments = {
                        "right": document.createElement("div"),
                        "center": document.createElement("div")
                    },
                    templateParameters = {
                        "right": document.createElement("div")
                    },
                    validation;

                validation = Component.prototype._validateTemplateArguments(
                    templateArguments, templateParameters);
                expect(validation).toBeDefined();
            });

            it("should bind the contents to the template star parameter", function () {
                var component = testPage.test.componentBindingStar1,
                    parameters,
                    center,
                    text;

                Component.prototype._bindTemplateParametersToArguments.call(component);

                parameters = Template.prototype._getParameters(component._templateElement);
                center = component.templateObjects.center;
                text = component._templateElement.querySelector(".text");

                expect(Object.keys(parameters).length).toBe(0);
                expect(text).toBeDefined();
                expect(center.element.children.length).toBe(3);
            });

            it("should bind the arguments to the template parameters", function () {
                var component = testPage.test.componentBindingParams1,
                    parameters,
                    left,
                    right,
                    leftText,
                    rightText;

                Component.prototype._bindTemplateParametersToArguments.call(component);

                parameters = Template.prototype._getParameters(component._templateElement);
                left = component.templateObjects.left;
                right = component.templateObjects.right;
                leftText = left.element.querySelector(".leftText");
                rightText = right.element.querySelector(".rightText");

                expect(Object.keys(parameters).length).toBe(0);
                expect(leftText).toBeDefined();
                expect(rightText).toBeDefined();
            });

            it("should fix the component tree when binding a template star parameter", function () {
                var component = testPage.test.componentBindingStar2,
                    parameters,
                    center,
                    text;

                Component.prototype._bindTemplateParametersToArguments.call(component);

                parameters = Template.prototype._getParameters(component._templateElement);
                center = component.templateObjects.center;
                text = component._templateElement.querySelector(".text");

                expect(center.childComponents.length).toBe(1);
                expect(center.childComponents[0]).toBe(text.component);

                expect(component.childComponents.length).toBe(1);
                expect(component.childComponents[0]).toBe(center);
            });

            it("should fix the component tree when binding template parameters", function () {
                var component = testPage.test.componentBindingParams2,
                    parameters,
                    center,
                    text;

                Component.prototype._bindTemplateParametersToArguments.call(component);

                left = component.templateObjects.left;
                right = component.templateObjects.right;
                leftText = left.element.querySelector(".leftText");
                rightText = right.element.querySelector(".rightText");

                expect(left.childComponents.length).toBe(1);
                expect(left.childComponents[0]).toBe(leftText.component);

                expect(right.childComponents.length).toBe(1);
                expect(right.childComponents[0]).toBe(rightText.component);
            });

            it("should clone the argument from the template for a named parameter", function (done) {
                 var templateHtml = require("spec/ui/draw/template-arguments.html").content,
                    template = new Template(),
                    component = new Component();


                template.initWithHtml(templateHtml).then(function () {
                    var section,
                        element,
                        originalArgument;

                    element = template.getElementById("comp1");
                    component._ownerDocumentPart = new DocumentPart();
                    component._ownerDocumentPart.template = template;
                    component._element = element;
                    originalArgument = element.querySelector(".section");

                    section = component.getTemplateArgumentElement("section");

                    expect(section).not.toBe(originalArgument);
                }).finally(function () {
                    done();
                });
            });

            it("should clone the contents of the component for the star parameter", function (done) {
                 var templateHtml = require("spec/ui/draw/template-arguments.html").content,
                    template = new Template(),
                    component = new Component();


                template.initWithHtml(templateHtml).then(function () {
                    var star,
                        element,
                        originalNodes,
                        starNodes;

                    element = template.getElementById("comp2");
                    component._ownerDocumentPart = new DocumentPart();
                    component._ownerDocumentPart.template = template;
                    component._element = element;

                    star = component.getTemplateArgumentElement("*");

                    originalNodes = element.childNodes;
                    starNodes = star.childNodes;

                    expect(starNodes.length).toEqual(originalNodes.length);
                    expect(starNodes === originalNodes).toBe(false);
                }).finally(function () {
                    done();
                });
            });

            it("should remove the data-arg attributes when cloning an argument for a named parameter", function (done) {
                 var templateHtml = require("spec/ui/draw/template-arguments.html").content,
                    template = new Template(),
                    component = new Component();


                template.initWithHtml(templateHtml).then(function () {
                    var section,
                        element,
                        dataArgs;

                    element = template.getElementById("comp1");
                    component._ownerDocumentPart = new DocumentPart();
                    component._ownerDocumentPart.template = template;
                    component._element = element;

                    section = component.getTemplateArgumentElement("section");

                    dataArgs = section.querySelectorAll("*[data-arg]");

                    expect(section.hasAttribute("data-arg")).toBeFalsy();
                    expect(dataArgs.length).toBe(0);
                }).finally(function () {
                    done();
                });
            });

            it("should clone the right argument and ignore arguments for nested components", function (done) {
                 var templateHtml = require("spec/ui/draw/template-arguments.html").content,
                    template = new Template(),
                    component = new Component();

                template.initWithHtml(templateHtml).then(function () {
                    var two,
                        element;

                    element = template.getElementById("comp3");
                    component._ownerDocumentPart = new DocumentPart();
                    component._ownerDocumentPart.template = template;
                    component._element = element;

                    two = component.getTemplateArgumentElement("two");

                    expect(two.className).toBe("two");
                }).finally(function () {
                    done();
                });
            });

            it("should clone an argument even if it's inside a data-montage-id element", function (done) {
                 var templateHtml = require("spec/ui/draw/template-arguments.html").content,
                    template = new Template(),
                    component = new Component();

                template.initWithHtml(templateHtml).then(function () {
                    var one,
                        element;

                    element = template.getElementById("comp4");
                    component._ownerDocumentPart = new DocumentPart();
                    component._ownerDocumentPart.template = template;
                    component._element = element;

                    one = component.getTemplateArgumentElement("one");

                    expect(one).toBeDefined();
                }).finally(function () {
                    done();
                });
            });

            it("should clone an argument even if it's wrapped by an element", function (done) {
                var templateHtml = require("spec/ui/draw/template-arguments.html").content,
                    template = new Template(),
                    component = new Component();

                template.initWithHtml(templateHtml).then(function () {
                    var one,
                        element;

                    element = template.getElementById("comp5");
                    component._ownerDocumentPart = new DocumentPart();
                    component._ownerDocumentPart.template = template;
                    component._element = element;

                    one = component.getTemplateArgumentElement("one");

                    expect(one).toBeDefined();
                }).finally(function () {
                    done();
                });
            });

            it("should not clone an argument of a nested component when the component argument is wrapped by an element", function (done) {
                var templateHtml = require("spec/ui/draw/template-arguments.html").content,
                    template = new Template(),
                    component = new Component();

                template.initWithHtml(templateHtml).then(function () {
                    var two,
                        element;

                    element = template.getElementById("comp6");
                    component._ownerDocumentPart = new DocumentPart();
                    component._ownerDocumentPart.template = template;
                    component._element = element;

                    two = component.getTemplateArgumentElement("two");

                    expect(two.className).toBe("two");
                }).finally(function () {
                    done();
                });
            });
        });

        describe("using classList", function () {
            describe("with bindings", function () {
                it("should correctly initialize from a template", function () {
                    expect(test.componentClassList.element.classList.contains("class1")).toBeTruthy();
                    expect(test.componentClassList.element.classList.contains("class2")).toBeFalsy();
                });
                it("should reflect changes to the classList's properties", function (done) {
                    test.class1 = false;
                    test.class2 = true;
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassList.element.classList.contains("class1")).toBeFalsy();
                        expect(test.componentClassList.element.classList.contains("class2")).toBeTruthy();
                    }).finally(function () {
                        done();
                    });
                });
                it("should be possible to bind to a new class", function (done) {
                    test.class3 = true;
                    Bindings.defineBinding(test.componentClassList, "classList.has('newClass')", {
                        source: test,
                        "<-": "class3"
                    });
                    expect(test.componentClassList.classList.contains("newClass")).toBeTruthy();
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassList.element.classList.contains("newClass")).toBeTruthy();
                    }).finally(function () {
                        done();
                    });
                });
            });
            describe("with programmatic API", function () {
                it("should correctly add a class", function (done) {
                    test.componentClassList.classList.add("myclass");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassList.element.classList.contains("myclass")).toBeTruthy();
                    }).finally(function () {
                        done();
                    });
                });
                it("should correctly remove a class", function (done) {
                    test.componentClassList.classList.remove("myclass");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassList.element.classList.contains("myclass")).toBeFalsy();
                    }).finally(function () {
                        done();
                    });
                });
                it("should correctly add more than one class", function (done) {
                    test.componentClassList.classList.add("myclass");
                    test.componentClassList.classList.add("myclass2");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassList.element.classList.contains("myclass")).toBeTruthy();
                        expect(test.componentClassList.element.classList.contains("myclass2")).toBeTruthy();
                    }).finally(function () {
                        done();
                    });
                });
                it("should correctly remove more than one class", function (done) {
                    test.componentClassList.classList.remove("myclass");
                    test.componentClassList.classList.remove("myclass2");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassList.element.classList.contains("myclass")).toBeFalsy();
                        expect(test.componentClassList.element.classList.contains("myclass2")).toBeFalsy();
                    }).finally(function () {
                        done();
                    });
                });
                it("should correctly toggle a class", function (done) {
                    test.componentClassList.classList.toggle("myclass");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassList.element.classList.contains("myclass")).toBeTruthy();
                    }).finally(function () {
                        done();
                    });
                });
                it("should correctly report contains state of a class", function () {
                    expect(test.componentClassList.classList.contains("myclass")).toBeTruthy();
                });
            });
            describe("with classes in original element", function () {
                it("should correctly add a class based on markup", function () {
                    expect(test.componentClassInMarkup.classList.contains("markupClass1")).toBeTruthy();
                    expect(test.componentClassInMarkup.classList.contains("markupClass2")).toBeTruthy();
                    expect(test.componentClassInMarkup.element.classList.contains("markupClass1")).toBeTruthy();
                    expect(test.componentClassInMarkup.element.classList.contains("markupClass2")).toBeTruthy();
                });
                it("should be able to change those classes as if they were added via the component", function (done) {
                    test.componentClassInMarkup.classList.toggle("markupClass1");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassInMarkup.element.classList.contains("markupClass1")).toBeFalsy();
                    }).finally(function () {
                        done();
                    });
                });
            });
            describe("with classes in original element and in template", function () {
                describe("element", function () {
                    it("should correctly preserve the class based on markup", function () {
                        expect(test.componentClassInTemplate.element.classList.contains("markupClass3")).toBeTruthy();
                    });
                    it("should correctly add a class from the template's markup", function () {
                        expect(test.componentClassInTemplate.element.classList.contains("ClassListTemplate")).toBeTruthy();
                    });
                });
                it("should correctly add a class to the component based on markup", function () {
                    expect(test.componentClassInTemplate.classList.contains("markupClass3")).toBeTruthy();
                });
                it("should correctly add a class from the template's markup to the component", function () {
                    expect(test.componentClassInTemplate.classList.contains("ClassListTemplate")).toBeTruthy();
                });
                it("should be able to change those classes as if they were added via the component", function (done) {
                    test.componentClassInTemplate.classList.toggle("ClassListTemplate");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassInTemplate.element.classList.contains("ClassListTemplate")).toBeFalsy();
                    }).finally(function () {
                        done();
                    });
                });
            });
            describe("with classes in element, template, and bindings", function () {
                describe("element", function () {
                    it("should correctly preserve the class based on markup", function () {
                        expect(test.componentClassInTemplateAndBindings.element.classList.contains("markupClass3")).toBeTruthy();
                    });
                    it("should correctly add a class from the template's markup", function () {
                        expect(test.componentClassInTemplateAndBindings.element.classList.contains("ClassListTemplate")).toBeTruthy();
                    });
                    it("should correctly have the classes from the bindings", function () {
                        expect(test.componentClassInTemplateAndBindings.element.classList.contains("class1")).toBeTruthy();
                        expect(test.componentClassInTemplateAndBindings.element.classList.contains("class2")).toBeFalsy();
                    });
                });
                it("should correctly add a class to the component based on markup", function () {
                    expect(test.componentClassInTemplateAndBindings.classList.contains("markupClass3")).toBeTruthy();
                });
                it("should correctly add a class from the template's markup to the component", function () {
                    expect(test.componentClassInTemplateAndBindings.classList.contains("ClassListTemplate")).toBeTruthy();
                });
                it("should be able to change those classes as if they were added via the component", function (done) {
                    test.componentClassInTemplateAndBindings.classList.toggle("ClassListTemplate");
                    testPage.nextDraw().then(function () {
                        expect(test.componentClassInTemplateAndBindings.element.classList.contains("ClassListTemplate")).toBeFalsy();
                    }).finally(function () {
                        done();
                    });
                });
            });
            describe("using classList before the element is set", function () {
                var aComponent;
                it("should update the classList when the element is set", function () {
                    aComponent = new (Component.specialize( {hasTemplate: { value: false}}))();
                    var anElement = document.createElement("div");
                    anElement.classList.add("foo");
                    expect(aComponent.classList.contains("foo")).toBeFalsy();
                    aComponent.element = anElement;
                    expect(aComponent.classList.contains("foo")).toBeTruthy();
                });
                it("should not fail when classList is used in constructor", function () {
                    expect(function () {
                        new (Component.specialize( {
                            hasTemplate: { value: false },
                            constructor: {
                                value: function () {
                                    this.classList.contains("foo");
                                }
                            }
                        }))();
                    }).not.toThrow();
                });
            });

        });

        describe("enter document", function () {
            var componentA,
                componentB,
                componentC;

            beforeEach(function () {
                componentA = new Component();
                componentB = new Component();
                componentC = new Component();

                componentA.hasTemplate = false;
                componentB.hasTemplate = false;
                componentC.hasTemplate = false;

                componentA.element = MockDOM.element();
                componentB.element = MockDOM.element();
                componentC.element = MockDOM.element();

                componentB.addChildComponent(componentC);

                componentA._isComponentExpanded = true;
                componentB._isComponentExpanded = true;
                componentC._isComponentExpanded = true;

                componentA._needsEnterDocument = false;
                componentB._needsEnterDocument = false;
                componentC._needsEnterDocument = false;

                componentA.inDocument = true;
                componentB.inDocument = false;
                componentC.inDocument = false;

                componentA._firstDraw = false;
                componentB._firstDraw = false;
                componentC._firstDraw = false;
            });

            it("should request enter document on all components of the sub component tree", function () {
                componentA.addChildComponent(componentB);

                expect(componentB._needsEnterDocument).toBe(true);
                expect(componentC._needsEnterDocument).toBe(true);
            });
        });

        describe("exit document", function () {
            var componentA,
                componentB,
                componentC;

            beforeEach(function () {
                componentA = new Component();
                componentB = new Component();
                componentC = new Component();

                componentA.element = MockDOM.element();
                componentB.element = MockDOM.element();
                componentC.element = MockDOM.element();

                componentA.addChildComponent(componentB);
                componentB.addChildComponent(componentC);

                componentA._isComponentExpanded = true;
                componentB._isComponentExpanded = true;
                componentC._isComponentExpanded = true;

                componentA._needsEnterDocument = false;
                componentB._needsEnterDocument = false;
                componentC._needsEnterDocument = false;

                componentA.inDocument = true;
                componentB.inDocument = true;
                componentC.inDocument = true;
            });

            it("should exit the document in bottom-up order", function () {
                var callOrder = [];
                var exitDocument = function () {
                    callOrder.push(this);
                };

                spyOn(componentB, "exitDocument").and.callFake(exitDocument);
                spyOn(componentC, "exitDocument").and.callFake(exitDocument);

                componentA.removeChildComponent(componentB);
                expect(callOrder[0]).toBe(componentC);
                expect(callOrder[1]).toBe(componentB);
            });
        });

        describe("resolveTemplateArgumentTemplateProperty", function () {
            it("should not resolve a template property not targeting the component", function () {
                var component = new Component(),
                    templatePropertyLabel;

                Montage.getInfoForObject(component).label = "component";
                component._templateDocumentPart = new DocumentPart();
                component._templateDocumentPart.objects = {
                    ":cell": {}
                };

                templatePropertyLabel = component.resolveTemplateArgumentTemplateProperty("otherComponent:cell");

                expect(templatePropertyLabel).toBeUndefined();
            });

            it("should not resolve when the template property is not an alias", function () {
                var component = new Component(),
                    templatePropertyLabel;

                Montage.getInfoForObject(component).label = "component";
                component._templateDocumentPart = new DocumentPart();
                component._templateDocumentPart.objects = {
                    ":cell": {}
                };

                templatePropertyLabel = component.resolveTemplateArgumentTemplateProperty("component:cell");

                expect(templatePropertyLabel).toBeUndefined();
            });

            it("should resolve an alias recursively until it finds a template property that is not an alias", function () {
                var component = new Component(),
                    templatePropertyLabel,
                    foo = new Component(),
                    bar = new Component();

                Montage.getInfoForObject(component).label = "component";
                component._templateDocumentPart = new DocumentPart();
                component._templateDocumentPart.objects = {
                    ":cell": new Alias().init("@foo:j"),
                    "foo": foo
                };

                Montage.getInfoForObject(foo).label = "foo";
                foo._templateDocumentPart = new DocumentPart();
                foo._templateDocumentPart.objects = {
                    ":j": new Alias().init("@bar:i"),
                    "bar": bar
                };

                Montage.getInfoForObject(bar).label = "bar";
                bar._templateDocumentPart = new DocumentPart();
                bar._templateDocumentPart.objects = {
                    ":i": {}
                };

                templatePropertyLabel = component.resolveTemplateArgumentTemplateProperty("component:cell");

                expect(templatePropertyLabel).toBe("bar:i");
            });
        });
        describe("array object pool", function () {
            var component;

            beforeEach(function () {
                component = new Component();
                component._arrayObjectPool.pool = null;
                component._arrayObjectPool.ix = 0;
            });

            it("should return an array", function () {
                var array = component._getArray();

                expect(Array.isArray(array)).toBeTruthy();
            });

            it("should return an empty array", function () {
                var array = component._getArray();

                expect(array.length).toBe(0);
            });

            it("should return different arrays", function () {
                var array1 = component._getArray(),
                    array2 = component._getArray();

                expect(array1).not.toBe(array2);
            });

            it("should return disposed array", function () {
                var array1 = component._getArray(),
                    array2;

                component._disposeArray(array1);
                array2 = component._getArray();

                expect(array1).toBe(array2);
            });

            it("should continue to return arrays after the pool is depleted", function () {
                var array;

                for (var i = 0; i <= component._arrayObjectPool.size; i++) {
                    component._getArray();
                }
                array = component._getArray();

                expect(Array.isArray(array)).toBeTruthy();
            });

            it("should dispose arrays when the pool is full", function () {
                var array = [],
                    ix = component._arrayObjectPool.ix;

                component._disposeArray(array);

                expect(component._arrayObjectPool.ix).toBe(ix);
            });
        });
    });
});
