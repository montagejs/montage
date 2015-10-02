var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Promise = require("montage/core/promise").Promise;

TestPageLoader.queueTest("repetition/selection-test/selection-test", function (testPage) {
    describe("ui/repetition-selection-spec", function () {

        var application, eventManager, nameController, repetition;

        var querySelector = function (s) {
            return testPage.querySelector(s);
        };
        var querySelectorAll = function (s) {
            return testPage.querySelectorAll(s);
        };

        it("should load", function () {
            expect(testPage.loaded).toBeTruthy();
            application = testPage.window.document.application;
            eventManager = application.eventManager;
            nameController = testPage.test.nameController;
            repetition = testPage.test.repetition;
        });

        it("modifies the component's classList", function () {
            var selectedIndex = 2;
            var selectedListElement = querySelectorAll("ul>li")[selectedIndex];
            var selectedListComponent = selectedListElement.component;
            // need to trigger the getter so that the component classList
            // is initialized
            var classList = selectedListComponent.classList;
            nameController.selection = [nameController.organizedContent[selectedIndex]];

            expect(repetition.selectedIndexes).toEqual([2]);

            testPage.waitForDraw();

            runs(function () {
                expect(selectedListComponent.classList.contains("selected")).toBeTruthy();
                expect(selectedListElement.classList.contains("selected")).toBeTruthy();
            });
        });

        describe("making a selection through the repetition using the mouse", function () {

            it("should set the selection in the contentController as expected", function () {
                var listElementToSelect = querySelectorAll("ul>li")[0];
                testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                    testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                        expect(nameController.selection[0]).toBe(nameController.organizedContent[0]);
                        expect(repetition.selectedIndexes).toEqual([0]);
                    });
                });
            });

            it("should set the selected class of the representative element", function () {
                var listElementToSelect = querySelectorAll("ul>li")[1];
                testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                    testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                        expect(listElementToSelect.classList.contains("selected")).toBeTruthy();
                        expect(repetition.selectedIndexes).toEqual([1]);
                    });
                });
            });

            it("should not deselect the representative element if clicked again", function () {
                var listElementToSelect = querySelectorAll("ul>li")[1];
                testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                    testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                        expect(listElementToSelect.classList.contains("selected")).toBeTruthy();
                        expect(repetition.selectedIndexes).toEqual([1]);

                        testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                            testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                                expect(listElementToSelect.classList.contains("selected")).toBeTruthy();
                                expect(repetition.selectedIndexes).toEqual([1]);
                            });
                        });
                    });
                });
            });
            it("should deselect the element if another is selected", function () {
                var listElementToSelect = querySelectorAll("ul>li")[2];
                testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                    testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                        expect(listElementToSelect.classList.contains("selected")).toBeTruthy();
                        expect(repetition.selectedIndexes).toEqual([2]);

                        var secondListElementToSelect = querySelectorAll("ul>li")[1];
                        testPage.mouseEvent({target: secondListElementToSelect}, "mousedown", function () {
                            testPage.mouseEvent({target: secondListElementToSelect}, "mouseup", function () {
                                expect(listElementToSelect.classList.contains("selected")).toBeFalsy();
                                expect(secondListElementToSelect.classList.contains("selected")).toBeTruthy();
                            });
                        });
                    });
                });
            });

        });

        describe("reflecting the contentController selection", function () {

            it("should mark the expected representative elements as selected", function () {
                var selectedIndex = 2;
                var selectedListElement = querySelectorAll("ul>li")[selectedIndex];
                nameController.selection = [nameController.organizedContent[selectedIndex]];
                expect(repetition.selectedIndexes).toEqual([2]);

                testPage.waitForDraw();

                runs(function () {
                    expect(selectedListElement.classList.contains("selected")).toBeTruthy();
                });
            });

            it("should continue to allow UI selection after programmatic selection", function () {
                var selectedIndex = 3;
                var selectedListElement = querySelectorAll("ul>li")[selectedIndex];
                nameController.selection = [nameController.organizedContent[selectedIndex]];
                expect(repetition.selectedIndexes).toEqual([3]);

                testPage.waitForDraw();

                runs(function () {
                    expect(selectedListElement.classList.contains("selected")).toBeTruthy();

                    var listElementToSelect = querySelectorAll("ul>li")[4];
                    testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                        testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                            expect(listElementToSelect.classList.contains("selected")).toBeTruthy();
                            expect(nameController.selection[0]).toBe(nameController.organizedContent[4]);
                            expect(repetition.selectedIndexes).toEqual([4]);
                        });
                    });

                });
            });

            it("should mark a newly added and newly selected object as selected", function () {
                testPage.test.addAndSelect();
                testPage.waitForDraw(2);
                var addedIndex = nameController.content.length - 1;
                expect(repetition.selectedIndexes).toEqual([addedIndex]);
                // It only needs 2 draws, but sometimes the draw doesn't happen in time...
                waits(100);

                runs(function () {
                    var selectedListElement = querySelectorAll("ul>li")[addedIndex];
                    expect(selectedListElement.classList.contains("selected")).toBeTruthy();
                });
            });

            describe("single selection", function () {
                it("should properly update the iterations selected property", function () {
                    var i;

                    repetition.contentController.selection = [];
                    for (i = 0; i < 6; i++) {
                        expect(repetition.iterations[i].selected).toBeFalsy();
                    }
                    repetition.contentController.selection = [repetition.iterations[0].object];
                    expect(repetition.iterations[0].selected).toBeTruthy();
                    for (i = 1; i < 6; i++) {
                        expect(repetition.iterations[i].selected).toBeFalsy();
                    }
                    repetition.contentController.selection = [repetition.iterations[1].object];
                    expect(repetition.iterations[0].selected).toBeFalsy();
                    expect(repetition.iterations[1].selected).toBeTruthy();
                    for (i = 2; i < 6; i++) {
                        expect(repetition.iterations[i].selected).toBeFalsy();
                    }
                });
            });

            describe("multiple selection", function () {
                it("should properly update the iterations selected property", function () {
                    var i;

                    repetition.contentController.multiSelect = true;
                    repetition.contentController.selection = [
                        repetition.iterations[0].object,
                        repetition.iterations[1].object
                    ];
                    expect(repetition.iterations[0].selected).toBeTruthy();
                    expect(repetition.iterations[1].selected).toBeTruthy();
                    for (i = 2; i < 6; i++) {
                        expect(repetition.iterations[i].selected).toBeFalsy();
                    }
                    repetition.contentController.selection = [
                        repetition.iterations[2].object,
                        repetition.iterations[3].object
                    ];
                    expect(repetition.iterations[0].selected).toBeFalsy();
                    expect(repetition.iterations[1].selected).toBeFalsy();
                    expect(repetition.iterations[2].selected).toBeTruthy();
                    expect(repetition.iterations[3].selected).toBeTruthy();
                    expect(repetition.iterations[4].selected).toBeFalsy();
                    expect(repetition.iterations[5].selected).toBeFalsy();
                    repetition.contentController.multiSelect = false;
                });
            });

        });

        describe("reflecting the Repetition selection into the iterations", function () {
            it("changes should properly update the iterations selected property", function () {
                var i;

                repetition.selection = [];
                for (i = 0; i < 6; i++) {
                    expect(repetition.iterations[i].selected).toBeFalsy();
                }
                repetition.selection = [repetition.iterations[0].object];
                expect(repetition.iterations[0].selected).toBeTruthy();
                for (i = 1; i < 6; i++) {
                    expect(repetition.iterations[i].selected).toBeFalsy();
                }
                repetition.selection = [repetition.iterations[1].object];
                expect(repetition.iterations[0].selected).toBeFalsy();
                expect(repetition.iterations[1].selected).toBeTruthy();
                for (i = 2; i < 6; i++) {
                    expect(repetition.iterations[i].selected).toBeFalsy();
                }
            });
        });

        describe("Repetition.selection binding", function () {
            it("should work after a new contentController is set up", function () {
                var foo = new Montage();

                repetition.contentController.selection = [];
                foo.repetition = repetition;
                foo.defineBinding("selected", {"<-": "repetition.selection.0"})
                repetition.content = repetition.content.slice(0);
                repetition.iterations[0].selected = true;
                expect(repetition.selection[0]).toEqual(repetition.iterations[0].object);
                expect(foo.selected).toEqual(repetition.iterations[0].object);
                repetition.iterations[1].selected = true;
                expect(repetition.selection[0]).toEqual(repetition.iterations[1].object);
                expect(foo.selected).toEqual(repetition.iterations[1].object);
            });
        });

        describe("changing visibleIndexes in repetition", function () {
            it("should properly update the iteration's selected property", function () {
                repetition.selection = [];
                expect(repetition.iterations[0].object).toEqual("Alice");
                expect(repetition.iterations[1].object).toEqual("Bob");
                expect(repetition.iterations[0].selected).toBeFalsy();
                expect(repetition.iterations[1].selected).toBeFalsy();
                repetition.iterations[0].selected = true;
                expect(repetition.iterations[0].selected).toBeTruthy();
                repetition.visibleIndexes = [1];
                expect(repetition.iterations[0].object).toEqual("Bob");
                expect(repetition.iterations[0].selected).toBeFalsy();
                repetition.visibleIndexes = [0];
                expect(repetition.iterations[0].object).toEqual("Alice");
                expect(repetition.iterations[0].selected).toBeTruthy();
            });
        });

    });
});
