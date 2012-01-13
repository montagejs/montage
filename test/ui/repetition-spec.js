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
    Template = require("montage/ui/template").Template;

var testPage = TestPageLoader.queueTest("repetition", function() {
    describe("ui/repetition-spec", function() {
        var eventManager,
            application,
            delegate;

        var querySelector = function(s) {
            return testPage.querySelector(s);
        };
        var querySelectorAll = function(s) {
            return testPage.querySelectorAll(s);
        };

        it("should load", function() {
            expect(testPage.loaded).toBeTruthy();
            application = testPage.window.document.application;
            eventManager = application.eventManager;
            delegate = application.delegate;
        });

        describe("main document template", function() {
            it("should empty inner markup and populate with the bindings value", function() {
                runs(function() {
                    expect(querySelectorAll(".list1 > *").length).toBe(0);
                    expect(querySelectorAll(".list2 > *").length).toBe(1);
                    expect(querySelectorAll(".list2 > li > input.textfield1").length).toBe(1);
                    expect(querySelector(".list2 > li > input.textfield1").value).toBe("This");
                    expect(querySelectorAll(".list3 > *").length).toBe(0);
                });
            });
        });

        describe("The static repetition", function() {
            it("should add one iteration on the static repetition", function() {
                delegate.list1Objects.push(1);
                testPage.waitForDraw();

                runs(function() {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(1);
                    expect(lis[0].textContent).toBe("Hello Friend!");
                });
            });

            it("should remove one iteration on the static repetition", function() {
                delegate.list1Objects.pop();
                testPage.waitForDraw();

                runs(function() {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(0);
                });
            });

            it("should add five iterations on the static repetition", function() {
                delegate.list1Objects.push(1, 2, 3, 4, 5);
                testPage.waitForDraw();

                runs(function() {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(5);
                    expect(lis[0].textContent).toBe("Hello Friend!");
                });
            });

            it("should remove five iteration on the static repetition", function() {
                delegate.list1Objects.splice(0, 5);
                testPage.waitForDraw();

                runs(function() {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(0);
                });
            });

            it("should change the repetition to three iterations on the static repetition", function() {
                delegate.list1Objects = [1, 2, 3];
                testPage.waitForDraw();

                runs(function() {
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(3);
                });
            });

            it("should change the repetition after a batch of operations", function() {
                delegate.list1Objects = [];
                testPage.waitForDraw();

                runs(function() {
                    // sanity test
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(0);

                    delegate.list1Objects.push(1);
                    delegate.list1Objects.push(2);
                    delegate.list1Objects.push(3);
                    delegate.list1Objects.pop();
                    delegate.list1Objects.push(3);
                    delegate.list1Objects.push(4);

                    testPage.waitForDraw();
                    runs(function() {
                        lis = querySelectorAll(".list1 > li");
                        expect(lis.length).toBe(4);
                    });
                });
            });

            it("should replace an item of the repetition", function() {
                delegate.list1Objects = [1];
                testPage.waitForDraw();

                runs(function() {
                    // sanity test
                    var lis = querySelectorAll(".list1 > li");
                    expect(lis.length).toBe(1);

                    delegate.list1Objects.pop();
                    delegate.list1Objects.push(2);

                    testPage.waitForDraw();
                    runs(function() {
                        lis = querySelectorAll(".list1 > li");
                        expect(lis.length).toBe(1);
                    });
                });
            });
        });

        describe("The component repetition", function() {
            it("should add one iteration on the component repetition", function() {
                delegate.list2Objects.push({text: "is"});
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list2 > li").length).toBe(2);
                    var input = querySelectorAll(".list2 > li > input.textfield1");
                    expect(input.length).toBe(2);
                    expect(input[1].value).toBe("is");
                });
            });

            it("should remove one iteration on the component repetition", function() {
                delegate.list2Objects.pop();
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list2 > li").length).toBe(1);
                    var input = querySelectorAll(".list2 > li > input.textfield1");
                    expect(input.length).toBe(1);
                    expect(input[0].value).toBe("This");
                });
            });

            it("should replace one iteration on the component repetition", function() {
                delegate.list2Objects = [{text: "This"}, {text: "is"}, {text: "Sparta"}];
                testPage.waitForDraw();

                runs(function() {
                    // sonity check
                    expect(querySelectorAll(".list2 > li").length).toBe(3);
                    delegate.list2Objects.setProperty("2", {text: "Motorola"});
                    testPage.waitForDraw();

                    runs(function() {
                        expect(querySelectorAll(".list2 > li").length).toBe(3);
                        var input = querySelectorAll(".list2 > li > input.textfield1");
                        expect(input.length).toBe(3);
                        expect(input[2].value).toBe("Motorola");
                    });
                });
            });

            it("should change the component repetition after a batch of operations", function() {
                delegate.list2Objects = [];
                testPage.waitForDraw();

                runs(function() {
                    // sanity test
                    var lis = querySelectorAll(".list2 > li");
                    expect(lis.length).toBe(0);

                    delegate.list2Objects.push({text: "item 1"});
                    delegate.list2Objects.push({text: "item 2"});
                    delegate.list2Objects.push({text: "item 3 will be deleted"});
                    delegate.list2Objects.pop();
                    delegate.list2Objects.push({text: "item 3"});
                    delegate.list2Objects.push({text: "item 4"});

                    testPage.waitForDraw();
                    runs(function() {
                        var inputs = querySelectorAll(".list2 > li > input.textfield1");
                        for (var i = 0, input; i < 4; i++) {

                            expect(inputs[i].value).toBe("item " + (i+1));
                        }
                    });
                });
            });

            it("should replace an item of the repetition", function() {
                delegate.list2Objects = [{text: "item 1"}];
                testPage.waitForDraw();

                runs(function() {
                    // sanity test
                    var lis = querySelectorAll(".list2 > li");
                    expect(lis.length).toBe(1);

                    delegate.list2Objects.pop();
                    delegate.list2Objects.push({text: "item 2"});

                    testPage.waitForDraw();
                    runs(function() {
                        var lis = querySelectorAll(".list2 > li");
                        expect(lis.length).toBe(1);

                        var input = querySelector(".list2 > li > input.textfield1");
                        expect(input.value).toBe("item 2");
                    });
                });
            });
        });

        describe("The nested repetition w/ component", function() {
            it("should draw one>one iteration on the nested repetition w/ component", function() {
                delegate.list3Objects = [[{text: "iteration 1"}]];
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list3 > li").length).toBe(1);
                    expect(querySelectorAll(".list3 > li > ul.list3a > li").length).toBe(1);
                    var inputs = querySelectorAll(".list3 > li > ul.list3a > li > input.textfield2");
                    expect(inputs.length).toBe(1);
                    expect(inputs[0].value).toBe("iteration 1");
                });
            });

            it("should draw one>three iteration on the nested repetition w/ component", function() {
                delegate.list3Objects = [[{text: "iteration 1"}, {text: "iteration 2"}, {text: "iteration 3"}]];
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list3 > li").length).toBe(1);
                    expect(querySelectorAll(".list3 > li > ul.list3a > li").length).toBe(3);
                    var inputs = querySelectorAll(".list3 > li > ul.list3a > li > input.textfield2");
                    expect(inputs.length).toBe(3);
                    expect(inputs[0].value).toBe("iteration 1");
                });
            });

            it("should draw one>five iterations on the nested repetition w/ component", function() {
                delegate.list3Objects = [[{text: "iteration 1"}, {text: "iteration 2"}, {text: "iteration 3"}], [{text: "iteration 1"}, {text: "iteration 2"}, {text: "iteration 3"}, {text: "iteration 4"}, {text: "iteration 5"}]];
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list3 > li").length).toBe(2);

                    // BUG: Chrome outputs 0 on this..
                    // expects(querySelector("#list3 > li:nth-child(2) > ul#list4-1").length).toBe(5);
                    var list3a = testPage.evaluateNode("//*[@class='list3']/li[2]/ul[@class='list3a']");
                    expect(list3a.querySelectorAll("li").length).toBe(5);

                    var inputs = list3a.querySelectorAll("input.textfield2");
                    for (var i = 0; i < 5; i++) {
                        expect(inputs[i]).toBeDefined();
                        expect(inputs[i].value).toBe("iteration " + (i+1));
                    }
                });
            });

            it("should remove one iteration on the nested repetition w/ component", function() {
                delegate.list3Objects.shift();
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list3 > li").length).toBe(1);
                    // should have not affected the other iteration
                    expect(querySelectorAll(".list3 > li > ul.list3a > li").length).toBe(5);
                });
            });

            //it("should remove one inner iteration on the nested repetition w/ component", function() {
            //    var innerArray = delegate.list3Objects[delegate.list3Objects.length-1];
            //
            //    innerArray.pop();
            //    testPage.waitForDraw();
            //    runs(function() {
            //        expect(querySelectorAll("#list3 > li").length).toBe(1);
            //
            //        expect(querySelectorAll("#list3 > li > ul#list3-list3a-0 > li").length).toBe(4);
            //        expect(querySelectorAll("#list3 > li > ul#list3-list3a-0 input#list3-list3a-0-textfield2-0").length).toBe(0);
            //
            //        for (var i = 1; i < 4; i++) {
            //            expect(querySelectorAll("#list3 > li > ul#list3-list3a-0 input#list3-list3a-0-textfield2-"+i).length).toBe(1);
            //        }
            //    });
            //});
        });

        describe("The nested repetition w/ Static Component Composition (SCC)", function() {
            it("should draw one>one iteration on the nested repetition w/ SCC", function() {
                delegate.list4Objects.push([1]);
                testPage.waitForDraw(2);

                runs(function() {
                    expect(querySelectorAll(".list4 > li").length).toBe(1);
                    expect(querySelectorAll(".list4 > li > ul.list4a > li").length).toBe(1);
                    expect(querySelectorAll(".list4 > li > ul.list4a > li > div.content3").length).toBe(1);
                    expect(querySelectorAll(".list4 > li > ul.list4a > li input").length).toBe(1);
                });
            });

            it("should draw one>five iterations on the nested repetition w/ SCC", function() {
                delegate.list4Objects.push([1, 2, 3, 4, 5]);
                testPage.waitForDraw();

                runs(function() {
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
                });
            });

            it("should remove one iteration on the nested repetition w/ SCC", function() {
                delegate.list4Objects.shift();
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list4 > li").length).toBe(1);
                    // should have not affected the other iteration
                    expect(querySelectorAll(".list4 > li > ul.list4a > li").length).toBe(5);
                });
            });

            //it("should remove one inner iteration on the nested repetition w/ component",
            //function() {
            //    var innerArray = delegate.list5Objects[delegate.list5Objects.length-1];
            //    innerArray.pop();
            //    testPage.waitForDraw();
            //
            //    runs(function() {
            //        expect(querySelectorAll("#list5 > li").length).toBe(1);
            //
            //        expect(querySelectorAll("#list5 > li > ul#list5-list5a-1 > li").length).toBe(4);
            //        expect(querySelectorAll("#list5 > li > ul#list5-list5a-1 input#list5-list5a-1-content3-0-textfield1").length).toBe(0);
            //        for (var i = 1; i < 4; i++) {
            //            expect(querySelectorAll("#list5 > li > ul#list5-list5a-1 input#list5-list5a-1-content3-" + i + "-textfield1").length).toBe(1);
            //        }
            //    });
            //});
        });

        describe("The nested repetition w/ Dynamic Component Composition (DCC)", function() {
            it("should draw one>one iteration on the nested repetition w/ DCC", function() {
                delegate.list5Objects.push([1]);
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list5 > li").length).toBe(1);
                    expect(querySelectorAll(".list5 > li > ul.list5a > li").length).toBe(1);
                    expect(querySelectorAll(".list5 > li > ul.list5a > li > div.content4").length).toBe(1);
                    expect(querySelectorAll(".list5 > li > ul.list5a input.textfield4").length).toBe(1);
                });
            });

            it("should draw one>five iterations on the nested repetition w/ DCC", function() {
                delegate.list5Objects.push([1, 2, 3, 4, 5]);
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list5 > li").length).toBe(2);

                    // BUG: Chrome outputs 0 on this..
                    // expect(querySelectorAll("#list3 > li:nth-child(2) > ul#list4-1 > li").length).toBe(5);
                    var list5a = testPage.evaluateNode("//*[@class='list5']/li[2]/ul[@class='list5a']");
                    expect(list5a.querySelectorAll("li").length).toBe(5);
                    var inputs = list5a.querySelectorAll("input");
                    expect(inputs.length).toBe(5);
                    for (var i = 0; i < 5; i++) {
                        expect(inputs[i].value).toBe("X here");
                    }
                });
            });

            it("should remove one iteration on the nested repetition w/ DCC", function() {
                delegate.list5Objects.shift();
                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list5 > li").length).toBe(1);
                    // should have not affected the other iteration
                    expect(querySelectorAll(".list5 > li > ul.list5a > li").length).toBe(5);
                });
            });

            //it("should remove one inner iteration on the nested repetition w/ DCC",
            //function() {
            //    var innerArray = delegate.list6Objects[delegate.list6Objects.length-1];
            //    innerArray.pop();
            //    testPage.waitForDraw();
            //
            //    runs(function() {
            //        expect(querySelectorAll("#list6 > li").length).toBe(1);
            //
            //        expect(querySelectorAll("#list6 > li > ul#list6-list6a-1 > li").length).toBe(4);
            //        expect(querySelectorAll("#list6 > li > ul#list6-list6a-1 input#list6-list6a-1-content4-0-textfield4").length).toBe(0);
            //        for (var i = 1; i < 4; i++) {
            //            expect(querySelectorAll("#list6 > li > ul#list6-list6a-1 input#list6-list6a-1-content4-" + i + "-textfield4").length).toBe(1);
            //        }
            //    });
            //});
        });



        describe("Repetition of a component with a binding", function() {
            it("should draw the repetition with the correct duplicated bindings", function() {
                var inputs = querySelectorAll(".list7 .textfield5");

                expect(inputs.length).toBe(2);
                expect(inputs[0].value).toBe("Hello");
                expect(inputs[0].value).toBe("Hello");
            });
        });

        describe("Repetition of a component with an action event listener", function() {
            it("should draw the repetition with the correct duplicated action event listeners", function() {
                var component = querySelectorAll(".textfield6")[0].controller;
                spyOn(application.delegate, "listener");

                var anEvent = document.createEvent("CustomEvent");
                anEvent.initCustomEvent("action", true, true, null);
                anEvent.type = "action";

                component.dispatchEvent.call(component, anEvent);
                expect(application.delegate.listener).toHaveBeenCalled();
            });
        });

        describe("Repetition of a direct component", function() {
            it("should be able to remove the iteration correctly", function() {
                delegate.list9Objects = [1];

                testPage.waitForDraw();

                runs(function() {
                    expect(querySelectorAll(".list9 input").length).toBe(1);

                    delegate.list9Objects.pop();
                    testPage.waitForDraw();

                    runs(function() {
                        expect(querySelectorAll(".list9 > input").length).toBe(0);
                    });
                });
            });
        });

        describe("Repetitions with different external objects", function() {
            it("should not reuse the same template if it has external objects associated", function() {
                var textfield1 = querySelector(".componentz1 input");
                var textfield2 = querySelector(".componentz2 input");

                expect(textfield1.value).toBe("o1");
                expect(textfield2.value).toBe("o2");
            });
        });


        describe("with a content controller", function() {
            it("it should have as many iterations as the arraycontroller's initial organizedObjects", function() {
                expect(querySelectorAll(".repetitionController > li").length).toBe(3);
            });
            it("it should increment the number of iterations", function() {
                delegate.simpleArrayControllerContent.push("four");

                testPage.waitForDraw();

                runs(function() {
                    expect(delegate.simpleArrayController.organizedObjects.length).toBe(4);
                    expect(querySelectorAll(".repetitionController > li").length).toBe(4);
                });
            });
        });

        describe("Repetition in a external component", function() {
            it("should draw the repetition", function() {
                var eventManager = testPage.window.document.application.eventManager;

                var componentit1 = eventManager.eventHandlerForElement(querySelector(".componentrep1"));
                var componentit2 = eventManager.eventHandlerForElement(querySelector(".componentrep2"));

                componentit1.listObjects = [{text: "rep1-0"}, {text: "rep1-1"}];
                componentit2.listObjects = [{text: "rep2-0"}, {text: "rep2-1"}];;

                testPage.waitForDraw();

                runs(function() {
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

            it("should draw the repetition of the 'component repetition'", function() {
                delegate.list6Objects = [{elements1: [{text: "rep0-comp1-0"}, {text: "rep0-comp1-1"}], elements2: [{text: "rep0-comp2-0"}, {text: "rep0-comp2-1"}]}, {elements1: [{text: "rep1-comp1-0"}, {text: "rep1-comp1-1"}], elements2: [{text: "rep1-comp2-0"}, {text: "rep1-comp2-1"}]}]

                testPage.waitForDraw();

                runs(function() {
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
            it("should draw a repetition with slow components", function() {
                // it should draw even if the 2nd component loads before the 1st one.
                delegate.list10Objects.push(1);
                delegate.list10Objects.push(2);

                testPage.waitForDraw();

                runs(function() {
                    // It just needs to draw
                });
            });
        });

    });
});
