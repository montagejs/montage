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
    Template = require("montage/core/template").Template;

var stripPP = function stripPrettyPrintting(str) {
    return str.replace(/\n\s*/g, "");
};

TestPageLoader.queueTest("repetition/repetition", function (testPage) {
    describe("ui/repetition-spec", function () {
        var eventManager,
            application,
            delegate;

        var querySelector = function (s) {
            return testPage.querySelector(s);
        };
        var querySelectorAll = function (s) {
            return testPage.querySelectorAll(s);
        };

        beforeEach(function () {
            application = testPage.window.mr("montage/core/application").application;
            eventManager = application.eventManager;
            delegate = application.delegate;
        });

        xit("should expect unloaded new iterations to be present during the draw", function () {
            var list14 = querySelector(".list14").component,
                willDraw = list14.willDraw,
                draw = list14.draw,
                didThrow = false;

            spyOn(list14, "willDraw").andCallFake(function () {
                list14._iterationTemplate._deserializer._compiledDeserializationFunctionString = null;
                list14._iterationTemplate._deserializer._areModulesLoaded = false;
                list14._iterationTemplate._deserializer._modules = {};
                list14.content.push(2);
                if (willDraw) {
                    return willDraw.apply(this, arguments);
                }
            });

            spyOn(list14, "draw").andCallFake(function () {
                try {
                    draw.apply(this, arguments);
                } catch (ex) {
                    didThrow = true;
                }
            });


            list14.content = [1];

            testPage.waitForComponentDraw(list14);
            runs(function () {
                expect(didThrow).toBe(false);
            });
        });

        it("should remove the correct child components when removing an iteration", function () {
            var list15 = querySelector(".list15").component;
            runs(function () {
                list15.content.unshift(1);
                testPage.waitForComponentDraw(list15);
            });
            runs(function () {
                expect(list15.childComponents[0].text).toBe(1);

                list15.content.unshift(0);
                testPage.waitForComponentDraw(list15);
            });
            runs(function () {
                expect(list15.childComponents.length).toBe(2);
                expect(list15.childComponents[0].text).toBe(1);
                expect(list15.childComponents[1].text).toBe(0);

                list15.content.shift();
                testPage.waitForComponentDraw(list15);
            });
            runs(function () {
                expect(list15.childComponents.length).toBe(1);
                expect(list15.childComponents[0].text).toBe(1);
            })
        });

        describe("main document template", function () {
            it("should empty inner markup and populate with the bindings value", function () {
                runs(function () {
                    expect(querySelectorAll(".list1 > *").length).toBe(0);
                    expect(querySelectorAll(".list2 > *").length).toBe(1);
                    expect(querySelectorAll(".list2 > li > input.textfield1").length).toBe(1);
                    expect(querySelector(".list2 > li > input.textfield1").value).toBe("This");
                    expect(querySelectorAll(".list3 > *").length).toBe(0);
                });
            });
        });

        xit("should not serialize bindings in the iteration template", function () {
            var serialization = delegate.repetition1._iterationTemplate._ownerSerialization;
            expect(stripPP(serialization)).toBe('{"owner":{"prototype":"montage/ui/repetition.reel","properties":{"element":{"#":"list1"},"_isComponentExpanded":true,"ownerComponent":{"@":"__root__"}}},"__root__":{}}');
        });

        describe("The static repetition", function () {
            it("should add one iteration on the static repetition", function () {
                delegate.list1Objects.push(1);
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(1);
                    expect(lis[0].textContent).toBe("Hello Friend!");
                });
            });

            it("should remove one iteration on the static repetition", function () {
                delegate.list1Objects.pop();
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(0);
                });
            });

            it("should add five iterations on the static repetition", function () {
                delegate.list1Objects.push(1, 2, 3, 4, 5);
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(5);
                    expect(lis[0].textContent).toBe("Hello Friend!");
                });
            });

            it("should remove five iteration on the static repetition", function () {
                delegate.list1Objects.splice(0, 5);
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(0);
                });
            });

            it("should change the repetition to three iterations on the static repetition", function () {
                delegate.list1Objects = [1, 2, 3];
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(3);
                });
            });

            it("should change the repetition after a batch of operations", function () {
                delegate.list1Objects = [];
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    // sanity test
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(0);

                    delegate.list1Objects.push(1);
                    delegate.list1Objects.push(2);
                    delegate.list1Objects.push(3);
                    delegate.list1Objects.pop();
                    delegate.list1Objects.push(3);
                    delegate.list1Objects.push(4);

                    testPage.waitForComponentDraw(delegate.repetition1);
                    runs(function () {
                        lis = querySelectorAll(".list1 > li");
                        expect(lis.length).toBe(4);
                    });
                });
            });

            it("should change the repetition on shift and consecutive pop", function () {
                delegate.list1Objects = [1, 2, 3];
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    // sanity test
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(3);

                    delegate.list1Objects.unshift(0);
                    delegate.list1Objects.pop();

                    testPage.waitForComponentDraw(delegate.repetition1);
                    runs(function () {
                        lis = querySelectorAll(".list1 > li");
                        expect(lis.length).toBe(3);
                    });
                });
            });

            it("should replace an item of the repetition", function () {
                delegate.list1Objects = [1];
                testPage.waitForComponentDraw(delegate.repetition1);

                runs(function () {
                    // sanity test
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(1);

                    delegate.list1Objects.pop();
                    delegate.list1Objects.push(2);

                    testPage.waitForComponentDraw(delegate.repetition1);
                    runs(function () {
                        lis = querySelectorAll(".list1 > li");
                        expect(lis.length).toBe(1);
                    });
                });
            });

            xit("[TODO] should create a repetition programmatically", function () {
                var Repetition = testPage.window.mr("montage/ui/repetition.reel").Repetition,
                    repetition = new Repetition();

                repetition.element = querySelector(".list12");
                repetition.content = [1, 2, 3];
                repetition.needsDraw = true;

                testPage.waitForComponentDraw(repetition);

                runs(function () {
                    // sanity test
                    var lis = repetition.element.querySelectorAll("li");
                    expect(lis.length).toBe(3);
                });
            });
        });

        describe("The component repetition", function () {
            it("should add one iteration on the component repetition", function () {
                delegate.list2Objects.push({text: "is"});
                testPage.waitForComponentDraw(delegate.repetition2);

                runs(function () {
                    expect(querySelectorAll(".list2 > li").length).toBe(2);
                    var input = querySelectorAll(".list2 > li > input.textfield1");
                    expect(input.length).toBe(2);
                    expect(input[1].value).toBe("is");
                });
            });

            it("should remove one iteration on the component repetition", function () {
                delegate.list2Objects.pop();
                testPage.waitForComponentDraw(delegate.repetition2);

                runs(function () {
                    expect(querySelectorAll(".list2 > li").length).toBe(1);
                    var input = querySelectorAll(".list2 > li > input.textfield1");
                    expect(input.length).toBe(1);
                    expect(input[0].value).toBe("This");
                });
            });

            it("should replace one iteration on the component repetition", function () {
                delegate.list2Objects = [{text: "This"}, {text: "is"}, {text: "Sparta"}];
                testPage.waitForComponentDraw(delegate.repetition2);

                runs(function () {
                    // sonity check
                    expect(querySelectorAll(".list2 > li").length).toBe(3);
                    delegate.list2Objects.set(2, {text: "Motorola"});
                    testPage.waitForDraw();

                    runs(function () {
                        expect(querySelectorAll(".list2 > li").length).toBe(3);
                        var input = querySelectorAll(".list2 > li > input.textfield1");
                        expect(input.length).toBe(3);
                        expect(input[2].value).toBe("Motorola");
                    });
                });
            });

            it("should change the component repetition after a batch of operations", function () {
                delegate.list2Objects = [];
                testPage.waitForComponentDraw(delegate.repetition2);

                runs(function () {
                    // sanity test
                    var lis = querySelectorAll(".list2 > li");
                    expect(lis.length).toBe(0);

                    delegate.list2Objects.push({text: "item 1"});
                    delegate.list2Objects.push({text: "item 2"});
                    delegate.list2Objects.push({text: "item 3 will be deleted"});
                    delegate.list2Objects.pop();
                    delegate.list2Objects.push({text: "item 3"});
                    delegate.list2Objects.push({text: "item 4"});

                    testPage.waitForComponentDraw(delegate.repetition2);
                    runs(function () {
                        var inputs = querySelectorAll(".list2 > li > input.textfield1");
                        for (var i = 0, input; i < 4; i++) {

                            expect(inputs[i].value).toBe("item " + (i+1));
                        }
                    });
                });
            });

            it("should replace an item of the repetition", function () {
                delegate.list2Objects = [{text: "item 1"}];
                testPage.waitForComponentDraw(delegate.repetition2);

                runs(function () {
                    // sanity test
                    var lis = querySelectorAll(".list2 > li");
                    expect(lis.length).toBe(1);

                    delegate.list2Objects.pop();
                    delegate.list2Objects.push({text: "item 2"});

                    testPage.waitForComponentDraw(delegate.repetition2);
                    runs(function () {
                        var lis = querySelectorAll(".list2 > li");
                        expect(lis.length).toBe(1);

                        var input = querySelector(".list2 > li > input.textfield1");
                        expect(input.value).toBe("item 2");
                    });
                });
            });
        });

        describe("The nested repetition w/ component", function () {
            it("should draw one>one iteration on the nested repetition w/ component", function () {
                delegate.list3Objects = [[{text: "iteration 1"}]];
                testPage.waitForComponentDraw(delegate.repetition4);

                runs(function () {
                    var innerRepetition;

                    expect(querySelectorAll(".list3 > li").length).toBe(1);

                    var expectationFunction = function () {
                        expect(innerRepetition.element.querySelectorAll("li").length).toBe(1);
                        var inputs = innerRepetition.element.querySelectorAll("li > input.textfield2");
                        expect(inputs.length).toBe(1);
                        expect(inputs[0].value).toBe("iteration 1");
                    };

                    // Depending on timing the inner repetitions might have not
                    // drawn yet so we need to wait till one of the inner
                    // repetitions draws because atm we're not able to draw two
                    // nested repetitions in a single draw.
                    innerRepetition = innerRepetition = querySelector(".list3 > li > .list3a").component;

                    if (innerRepetition.needsDraw) {
                        testPage.waitForComponentDraw(innerRepetition);
                        runs(expectationFunction);
                    } else {
                        expectationFunction();
                    }
                });
            });

            it("should draw one>three iteration on the nested repetition w/ component", function () {
                delegate.list3Objects = [[{text: "iteration 1"}, {text: "iteration 2"}, {text: "iteration 3"}]];
                testPage.waitForComponentDraw(querySelector(".list3 > li > ul.list3a").component);

                runs(function () {
                    expect(querySelectorAll(".list3 > li").length).toBe(1);
                    expect(querySelectorAll(".list3 > li > ul.list3a > li").length).toBe(3);
                    var inputs = querySelectorAll(".list3 > li > ul.list3a > li > input.textfield2");
                    expect(inputs.length).toBe(3);
                    expect(inputs[0].value).toBe("iteration 1");
                });
            });

            it("should draw one>five iterations on the nested repetition w/ component", function () {
                console.log("***** should draw one>five iterations START");
                delegate.list3Objects = [[{text: "iteration 1"}, {text: "iteration 2"}, {text: "iteration 3"}], [{text: "iteration 1"}, {text: "iteration 2"}, {text: "iteration 3"}, {text: "iteration 4"}, {text: "iteration 5"}]];
                console.log("testPage.waitForComponentDraw(delegate.repetition4)");
                testPage.waitForComponentDraw(delegate.repetition4);
                var expectationFunction = function () {
                    console.log("should draw one>five iterations –expectationFunction START");
                    expect(querySelectorAll(".list3 > li").length).toBe(2);
                    console.log("should draw one>five iterations –expectationFunction expect 1 passed");

                    // BUG: Chrome outputs 0 on this..
                    // expects(querySelector("#list3 > li:nth-child(2) > ul#list4-1").length).toBe(5);
                    var list3a = testPage.evaluateNode("//*[@class='list3']/li[2]/ul[@class='list3a']");
                    expect(list3a.querySelectorAll("li").length).toBe(5);
                    console.log("should draw one>five iterations –expectationFunction expect 2 passed");

                    var inputs = list3a.querySelectorAll("input.textfield2");
                    console.log("should draw one>five iterations –expectationFunction inputs:",inputs);
                    for (var i = 0; i < 5; i++) {
                        expect(inputs[i]).toBeDefined();
                        expect(inputs[i].value).toBe("iteration " + (i+1));
                    }
                    console.log("***** should draw one>five iterations END");
                };

                runs(function () {
                    // Depending on timing the inner repetitions might have not
                    // drawn yet so we need to wait till one of the inner
                    // repetitions draws because atm we're not able to draw two
                    // nested repetitions in a single draw.
                    var innerRepetition = delegate.repetition4.element.querySelector(".list3a").component;

                    if (innerRepetition.needsDraw) {
                        console.log("testPage.waitForComponentDraw(innerRepetition)");
                        testPage.waitForComponentDraw(innerRepetition);
                        console.log("should draw one>five iterations –runs(expectationFunction)");
                        runs(expectationFunction);
                    } else {
                        console.log("should draw one>five iterations –expectationFunction()");
                        expectationFunction();
                    }
                });
            });

            it("should remove one iteration on the nested repetition w/ component", function () {
                delegate.list3Objects.shift();
                testPage.waitForComponentDraw(delegate.repetition4);

                runs(function () {
                    expect(querySelectorAll(".list3 > li").length).toBe(1);
                    // should have not affected the other iteration
                    expect(querySelectorAll(".list3 > li > ul.list3a > li").length).toBe(5);
                });
            });

            it("should remove one inner iteration on the nested repetition w/ component", function () {
                var innerArray = delegate.list3Objects[delegate.list3Objects.length-1];

                innerArray.pop();
                testPage.waitForDraw();
                runs(function () {
                    expect(querySelectorAll(".list3 > li").length).toBe(1);

                    expect(querySelectorAll(".list3 > li:first-child > ul > li").length).toBe(4);

                    for (var i = 1; i < 4; i++) {
                        expect(querySelectorAll(".list3 > li:first-child > ul > li:nth-child(" + i + ")").length).toBe(1);
                    }
                });
            });
        });

        describe("The nested repetition w/ Static Component Composition (SCC)", function () {
            it("should draw one>one iteration on the nested repetition w/ SCC", function () {
                delegate.list4Objects.push([1]);
                testPage.waitForComponentDraw(delegate.repetition5);

                runs(function () {
                    // we need to wait till one of the inner repetitions draws
                    // because atm we're not able to draw two nested repetitions
                    // in a single draw.
                    var innerRepetition = delegate.repetition5.element.querySelector(".list4a").component;
                    testPage.waitForComponentDraw(innerRepetition);

                    runs(function () {
                        expect(querySelectorAll(".list4 > li").length).toBe(1);
                        expect(querySelectorAll(".list4 > li > ul.list4a > li").length).toBe(1);
                        expect(querySelectorAll(".list4 > li > ul.list4a > li > div.content3").length).toBe(1);
                        expect(querySelectorAll(".list4 > li > ul.list4a > li input").length).toBe(1);
                    });
                });
            });

            it("should draw one>five iterations on the nested repetition w/ SCC", function () {
                delegate.list4Objects.push([1, 2, 3, 4, 5]);
                testPage.waitForComponentDraw(delegate.repetition5);

                runs(function () {
                    // Depending on timing the inner repetitions might have not
                    // drawn yet so we need to wait till one of the inner
                    // repetitions draws because atm we're not able to draw two
                    // nested repetitions in a single draw.
                    var innerRepetition = delegate.repetition5.element.querySelectorAll(".list4a")[1].component;
                    var expectationFunction = function () {
                        expect(querySelectorAll(".list4 > li").length).toBe(2);

                        // BUG: Chrome outputs 0 on this..
                        // expect(querySelectorAll("#list3 > li:nth-child(2) > ul#list4-1 > li").length).toBe(5);
                        var list4a = testPage.evaluateNode("//*[@class='list4']/li[2]/ul[@class='list4a']");
                        expect(list4a.querySelectorAll("li").length).toBe(5);
                        var inputs = list4a.querySelectorAll("input");
                        expect(inputs.length).toBe(5);
                        for (var i = 0; i < 5; i++) {
                            expect(inputs[i].value).toBe("a component Y textfield");
                        }
                    };

                    if (innerRepetition.needsDraw) {
                        testPage.waitForComponentDraw(innerRepetition);
                        runs(expectationFunction);
                    } else {
                        expectationFunction();
                    }
                });
            });

            it("should remove one iteration on the nested repetition w/ SCC", function () {
                delegate.list4Objects.shift();
                testPage.waitForComponentDraw(delegate.repetition5);

                runs(function () {
                    expect(querySelectorAll(".list4 > li").length).toBe(1);
                    // should have not affected the other iteration
                    expect(querySelectorAll(".list4 > li > ul.list4a > li").length).toBe(5);
                });
            });

        });

        describe("The nested repetition w/ Dynamic Component Composition (DCC)", function () {
            it("should draw one>one iteration on the nested repetition w/ DCC", function () {
                delegate.list5Objects.push([1]);
                testPage.waitForComponentDraw(delegate.repetition7);

                runs(function () {
                    // Depending on timing the inner repetitions might have not
                    // drawn yet so we need to wait till one of the inner
                    // repetitions draws because atm we're not able to draw two
                    // nested repetitions in a single draw.
                    var innerRepetition = delegate.repetition7.element.querySelector(".list5a").component;

                    var expectationFunction = function () {
                        expect(querySelectorAll(".list5 > li").length).toBe(1);
                        expect(querySelectorAll(".list5 > li > ul.list5a > li").length).toBe(1);
                        expect(querySelectorAll(".list5 > li > ul.list5a > li > div.content4").length).toBe(1);
                        expect(querySelectorAll(".list5 > li > ul.list5a input.textfield4").length).toBe(1);
                    };

                    if (innerRepetition.needsDraw) {
                        testPage.waitForComponentDraw(innerRepetition);
                        runs(expectationFunction);
                    } else {
                        expectationFunction();
                    }
                });
            });

            it("should draw one>five iterations on the nested repetition w/ DCC", function () {
                delegate.list5Objects.push([1, 2, 3, 4, 5]);
                testPage.waitForComponentDraw(delegate.repetition7);

                runs(function () {
                    // Depending on timing the inner repetitions might have not
                    // drawn yet so we need to wait till one of the inner
                    // repetitions draws because atm we're not able to draw two
                    // nested repetitions in a single draw.
                    var innerRepetition = delegate.repetition7.element.querySelectorAll(".list5a")[1].component;

                    var expectationFunction = function () {
                        expect(querySelectorAll(".list5 > li").length).toBe(2);

                        expect(querySelectorAll(".list5 > li:nth-child(2) > ul.list5a > li").length).toBe(5);
                        var list5a = testPage.evaluateNode("//*[@class='list5']/li[2]/ul[@class='list5a']");
                        expect(list5a.querySelectorAll("li").length).toBe(5);
                        var inputs = list5a.querySelectorAll("input");
                        expect(inputs.length).toBe(5);
                        for (var i = 0; i < 5; i++) {
                            expect(inputs[i].value).toBe("X here");
                        }
                    };

                    if (innerRepetition.needsDraw) {
                        testPage.waitForComponentDraw(innerRepetition);
                        runs(expectationFunction);
                    } else {
                        expectationFunction();
                    }
                });
            });

            it("should remove one iteration on the nested repetition w/ DCC", function () {
                delegate.list5Objects.shift();
                testPage.waitForComponentDraw(delegate.repetition7);

                runs(function () {
                    expect(querySelectorAll(".list5 > li").length).toBe(1);
                    // should have not affected the other iteration
                    expect(querySelectorAll(".list5 > li > ul.list5a > li").length).toBe(5);
                });
            });

            it("should remove one inner iteration on the nested repetition w/ DCC",
            function () {
                var innerArray = delegate.list5Objects[delegate.list5Objects.length-1];
                innerArray.pop();
                testPage.waitForDraw();

                runs(function () {
                    expect(querySelectorAll(".list5 > li").length).toBe(1);
                    expect(querySelectorAll(".list5 > li > ul.list5a > li").length).toBe(4);
                });
            });
        });

        describe("Repetition of a component with a binding", function () {
            it("should draw the repetition with the correct duplicated bindings", function () {
                var inputs = querySelectorAll(".list7 .textfield5");

                expect(inputs.length).toBe(2);
                expect(inputs[0].value).toBe("Hello");
                expect(inputs[0].value).toBe("Hello");
            });
        });

        describe("Repetition of a component with an action event listener", function () {
            it("should draw the repetition with the correct duplicated action event listeners", function () {
                var component = querySelectorAll(".textfield6")[0].component;
                spyOn(application.delegate, "listener");

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("action", true, true, null);

                component.dispatchEvent.call(component, anEvent);
                expect(application.delegate.listener).toHaveBeenCalled();
            });
        });

        describe("Repetition of a direct component", function () {
            it("should be able to remove the iteration correctly", function () {
                delegate.list9Objects = [1];

                testPage.waitForComponentDraw(delegate.repetition12);

                runs(function () {
                    expect(querySelectorAll(".list9 input").length).toBe(1);

                    delegate.list9Objects.pop();
                    testPage.waitForComponentDraw(delegate.repetition12);

                    runs(function () {
                        expect(querySelectorAll(".list9 > input").length).toBe(0);
                    });
                });
            });
        });

        describe("Repetitions with different external objects", function () {
            it("should not reuse the same template if it has external objects associated", function () {
                var textfield1 = querySelector(".componentz1 input");
                var textfield2 = querySelector(".componentz2 input");

                expect(textfield1.value).toBe("o1");
                expect(textfield2.value).toBe("o2");
            });
        });


        describe("with a content controller", function () {
            it("it should have as many iterations as the arraycontroller's initial organizedObjects", function () {
                expect(querySelectorAll(".repetitionController > li").length).toBe(3);
            });
            xit("it should increment the number of iterations", function () {
                delegate.simpleArrayControllerContent.push("four");

                testPage.waitForComponentDraw(delegate.repetitionController);

                runs(function () {
                    expect(delegate.simpleArrayController.iterations.length).toBe(4);
                    expect(querySelectorAll(".repetitionController > li").length).toBe(4);
                });
            });
        });

        describe("Repetition in a external component", function () {
            it("should draw the repetition", function () {
                var eventManager = testPage.window.document.application.eventManager;

                var componentit1 = eventManager.eventHandlerForElement(querySelector(".componentrep1"));
                var componentit2 = eventManager.eventHandlerForElement(querySelector(".componentrep2"));

                componentit1.listObjects = [{text: "rep1-0"}, {text: "rep1-1"}];
                componentit2.listObjects = [{text: "rep2-0"}, {text: "rep2-1"}];;

                testPage.waitForComponentDraw(querySelector(".componentrep2 > ul").component);

                runs(function () {
                    var inputs;

                    inputs = querySelectorAll(".componentrep1 input");
                    expect(inputs.length).toBe(2);
                    expect(inputs[0].value).toBe("rep1-0");
                    expect(inputs[1].value).toBe("rep1-1");

                    inputs = querySelectorAll(".componentrep2 input");
                    expect(inputs.length).toBe(2);
                    expect(inputs[0].value).toBe("rep2-0");
                    expect(inputs[1].value).toBe("rep2-1");
                });
            });

            it("should draw the repetition of the 'component repetition'", function () {
                delegate.list6Objects = [
                    {
                        elements1: [
                            {text: "rep0-comp1-0"},
                            {text: "rep0-comp1-1"}
                        ],
                        elements2: [
                            {text: "rep0-comp2-0"},
                            {text: "rep0-comp2-1"}
                        ]
                    },
                    {
                        elements1: [
                            {text: "rep1-comp1-0"},
                            {text: "rep1-comp1-1"}
                        ],
                        elements2: [
                            {text: "rep1-comp2-0"},
                            {text: "rep1-comp2-1"}
                        ]
                    }
                ];
                testPage.waitForComponentDraw(delegate.repetition9);
                // Note: the inner repetition does in fact draw in the same
                // draw cycle
                runs(function () {
                    var inputs;
                    inputs = querySelectorAll(".list6comp1 input");
                    expect(inputs.length).toBe(4);
                    expect(inputs[0].value).toBe("rep0-comp1-0");
                    expect(inputs[1].value).toBe("rep0-comp1-1");
                    expect(inputs[2].value).toBe("rep1-comp1-0");
                    expect(inputs[3].value).toBe("rep1-comp1-1");

                    inputs = querySelectorAll(".list6comp2 input");
                    expect(inputs.length).toBe(4);
                    expect(inputs[0].value).toBe("rep0-comp2-0");
                    expect(inputs[1].value).toBe("rep0-comp2-1");
                    expect(inputs[2].value).toBe("rep1-comp2-0");
                    expect(inputs[3].value).toBe("rep1-comp2-1");
                });
            });

            // This test needs to be run last since slow to load components do block the draw
            it("should draw a repetition with slow components", function () {
                // it should draw even if the 2nd component loads before the 1st one.
                delegate.list10Objects.push(1);
                delegate.list10Objects.push(2);

                testPage.waitForDraw();

                runs(function () {
                    // It just needs to draw
                });
            });
        });

        describe("Repetition innerTemplate change", function () {
            it("should rebuild the repetition", function () {
                var repetition = querySelector(".list11").component;

                runs(function () {
                    var content = repetition.element.children;
                    expect(content.length).toBe(3);
                    for (var i = 0; i < content.length; i++) {
                        expect(content[i].textContent).toBe("X");
                    }

                    var newTemplate = repetition.innerTemplate.clone();

                    newTemplate.document.querySelector("li").textContent = "Y";

                    repetition.innerTemplate = newTemplate;
                });
                testPage.waitForComponentDraw(repetition);
                runs(function () {
                    var content = repetition.element.children;
                    expect(content.length).toBe(3);
                    for (var i = 0; i < content.length; i++) {
                        expect(content[i].textContent).toBe("Y");
                    }
                });
            });

            it("should rebuild the repetition with components", function () {
                var repetition = querySelector(".list11b").component;
                var templateRepetition = querySelector(".list11btemplate").component;

                runs(function () {
                    var content = repetition.element.children;
                    expect(content.length).toBe(3);
                    for (var i = 0; i < content.length; i++) {
                        expect(content[i].textContent).toBe("X");
                    }

                    var newTemplate = templateRepetition.innerTemplate;

                    repetition.innerTemplate = newTemplate;
                });
                testPage.waitForComponentDraw(repetition);
                runs(function () {
                    var content = repetition.element.children;
                    expect(content.length).toBe(3);
                    for (var i = 0; i < content.length; i++) {
                        expect(content[i].textContent).toBe("Y");
                        expect(content[i].component.value).toBe("Y");
                    }
                });
            });

        });

        describe("manual objects changes", function () {
            var list13, object;
            beforeEach(function () {
                list13 = querySelector(".list13").component;
                object = {array: [1, 2, 3]};
            });

            it("should add an iteration when an object is pushed", function () {
                list13.content.push(4);
                testPage.waitForComponentDraw(delegate.repetition15);
                runs(function () {
                    expect(querySelectorAll(".list13 > li").length).toBe(4);
                });
            });

            xit("should call update items once if a binding to objects is in place", function () {
                spyOn(list13, "_updateItems").andCallThrough();
                testPage.window.list13.defineBinding("objects", {
                    "<-": "array",
                    source: object
                });

                expect(list13._updateItems.callCount).toBe(1);
            });

            xit("should call update items once if a binding to objects is removed", function () {
                spyOn(list13, "_updateItems").andCallThrough();
                testPage.window.Object.deleteBinding(list13, "objects");
                list13.content.push(4);
                expect(list13._updateItems.callCount).toBe(1);
            });
        });

        it("should draw inner repetitions with their original objects value", function () {
            var lis = querySelectorAll(".list17 > li");
            expect(lis.length).toBe(3*2);
        })

        describe("iteration template", function () {
            it("should expand template star parameter", function () {
                var component = querySelector(".listParameters ul").component,
                    template = component._iterationTemplate,
                    serialization = template.getSerialization(),
                    labels = serialization.getSerializationLabels();

                expect(labels).toContain("listParametersText");
                expect(template.getElementById("listParametersText"))
                    .toBeDefined();
            });

            it("should expand template star parameter with multiple expansions", function () {
                var component = querySelector(".listParametersDecorator ul").component,
                    template = component._iterationTemplate,
                    serialization = template.getSerialization(),
                    labels = serialization.getSerializationLabels(),
                    instances = template.getInstances();

                expect(labels).toContain("text");
                expect(labels).toContain("decoratorText");
                expect(labels).toContain("listParametersDecoratorText");

                expect(template.getElementById("text"))
                    .toBeDefined();
                expect(template.getElementById("listParametersDecoratorText"))
                    .toBeDefined();

                expect("decoratorText" in instances).toBeTruthy();
            });

            it("should expand template star parameter with multiple expansions and colliding object", function () {
                var component = querySelector(".listParametersDecoratorColliding ul").component,
                    template = component._iterationTemplate,
                    serialization = template.getSerialization(),
                    labels = serialization.getSerializationLabels(),
                    instances = template.getInstances(),
                    serializationObject = serialization.getSerializationObject(),
                    textObjectLabel;

                expect(labels).toContain("text");
                expect(labels).toContain("decoratorText");
                expect(labels).toContain("listParametersDecoratorCollidingText");

                expect(template.getElementById("text"))
                    .toBeDefined();
                expect(template.getElementById("listParametersDecoratorCollidingText"))
                    .toBeDefined();

                expect("decoratorText" in instances).toBeTruthy();

                // Make sure that external object "text" that collided with
                // another object's label has the correct instance associated
                // with it.
                textObjectLabel = serializationObject.listParametersDecoratorCollidingText.properties.text["@"];
                expect(instances[textObjectLabel]).toBe("Text Collision");
            });

            it("should expand template with named parameters", function () {
                var elements = querySelectorAll(".namedParameters ul"),
                    template,
                    serialization,
                    labels;

                // left side
                template = elements[0].component._iterationTemplate;
                serialization = template.getSerialization();
                labels = serialization.getSerializationLabels();

                expect(labels).toContain("leftSideTitle");
                expect(labels).toContain("textfield9");

                expect(template.getElementById("leftSideTitle"))
                    .toBeDefined();
                expect(template.getElementById("textfield9"))
                    .toBeDefined();

                // right side
                template = elements[1].component._iterationTemplate;
                serialization = template.getSerialization();
                labels = serialization.getSerializationLabels();

                expect(labels).toContain("rightSideTitle");
                expect(labels).toContain("textfield10");

                expect(template.getElementById("rightSideTitle"))
                    .toBeDefined();
                expect(template.getElementById("textfield10"))
                    .toBeDefined();
            });

            describe("property templates", function () {
                it("should expand template with an alias to repetition:iteration", function () {
                    var elements = querySelectorAll(".aliasRepetitionIteration .text100");

                    expect(elements[0].component.value).toBe("1");
                    expect(elements[1].component.value).toBe("2");
                });

                it("should expand template with an alias to nested repetition:iteration", function () {
                    var elements = querySelectorAll(".aliasNestedRepetitionIteration .text110");

                    expect(elements[0].component.value).toBe("1-a");
                    expect(elements[1].component.value).toBe("1-b");
                    expect(elements[2].component.value).toBe("2-a");
                    expect(elements[3].component.value).toBe("2-b");
                });

                it("should expand template with a chained alias to repetition:iteration", function () {
                    var elements = querySelectorAll(".aliasChainedRepetitionIteration .text120");

                    expect(elements[0].component.value).toBe("1");
                    expect(elements[1].component.value).toBe("2");
                });

                it("should expand the correct alias to repetition:iteration", function () {
                    var elements = querySelectorAll(".aliasMixedRepetitionIteration .header");

                    expect(elements[0].component.value).toBe("a1");
                    expect(elements[1].component.value).toBe("a2");

                    elements = querySelectorAll(".aliasMixedRepetitionIteration .innerText");

                    expect(elements[0].component.value).toBe("b1");
                    expect(elements[1].component.value).toBe("b2");
                    expect(elements[2].component.value).toBe("b1");
                    expect(elements[3].component.value).toBe("b2");

                    elements = querySelectorAll(".aliasMixedRepetitionIteration .outerText");

                    expect(elements[0].component.value).toBe("a1");
                    expect(elements[1].component.value).toBe("a1");
                    expect(elements[2].component.value).toBe("a2");
                    expect(elements[3].component.value).toBe("a2");
                });
            });
        });
        describe("objectAtCurrentIteration property", function () {
            it("should be still working", function () {
                var elements = querySelectorAll(".objectAtCurrentIteration");
                expect(elements.length).toBe(1);
            });
            it("should cause a deprecation warning", function () {
                var repetition = querySelectorAll(".repetitionWithObjectAtCurrentIteration")[0].component;
                expectConsoleCallsFrom(function () {
                    repetition.observeProperty("objectAtCurrentIteration", Function.noop, Function.noop );
                }, testPage.window, "warn").toHaveBeenCalledWith("objectAtCurrentIteration is deprecated, use :iteration.object instead.", "");
            });
        });
        describe("contentAtCurrentIteration property", function () {
            it("should cause a deprecation warning", function () {
                var repetition = querySelectorAll(".repetitionWithObjectAtCurrentIteration")[0].component;
                expectConsoleCallsFrom(function () {
                    repetition.observeProperty("contentAtCurrentIteration", Function.noop, Function.noop );
                }, testPage.window, "warn").toHaveBeenCalledWith("contentAtCurrentIteration is deprecated, use :iteration.object instead.", "");
            });
        });
        describe("currentIteration property", function () {
            it("should cause a deprecation warning", function () {
                var repetition = querySelectorAll(".repetitionWithObjectAtCurrentIteration")[0].component;
                expectConsoleCallsFrom(function () {
                    repetition.observeProperty("currentIteration", Function.noop, Function.noop );
                }, testPage.window, "warn").toHaveBeenCalledWith("currentIteration is deprecated, use :iteration instead.", "");
            });
        });

        describe("repetition within a substitution", function () {
            it("should see elements from the repetition inside the substitution", function () {
                var elements = querySelectorAll(".textInSubstitution");
                expect(elements.length).toBe(3);
            });
        });

        describe("iteration selection", function () {
            it("should select an iteration that does not have components when clicked", function () {
                var repetition = delegate.domRepetition;
                var li = repetition.element.querySelectorAll("li")[1];
                testPage.mouseEvent({target: li}, "mousedown", function () {
                    testPage.mouseEvent({target: li}, "mouseup", function () {
                        expect(repetition.iterations[1].selected).toBe(true);
                    });
                });
            });
        });

        describe("repetitions on tables", function() {
            it("should preserve the original structure of the table", function() {
                var repetition = delegate.tableRepetition;
                expect(repetition.element.querySelectorAll("tr").length).toBe(2);
            });
        });
    });
});
