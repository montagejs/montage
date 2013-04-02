var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    Promise = require("montage/core/promise").Promise;

TestPageLoader.queueTest("repetition/selection-test/selection-test", function(testPage) {
    describe("ui/repetition-selection-spec", function() {

        var application, eventManager, delegate, nameController;

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
            nameController = testPage.test.nameController;
        });

        describe("making a selection through the repetition using the mouse", function () {

            it("should set the selection in the contentController as expected", function () {
                var listElementToSelect = querySelectorAll("ul>li")[0];
                testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                    testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                        expect(nameController.selection[0]).toBe(nameController.organizedContent[0]);
                    });
                });
            });

            it("should set the selected class of the representative element", function () {
                var listElementToSelect = querySelectorAll("ul>li")[1];
                testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                    testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                        expect(listElementToSelect.classList.contains("selected")).toBeTruthy();
                    });
                });
            });

        });

        describe("reflecting the contentController selection", function () {

            it("should mark the expected representative elements as selected", function () {
                var selectedIndex = 2;
                var selectedListElement = querySelectorAll("ul>li")[selectedIndex];
                nameController.selection = [nameController.organizedContent[selectedIndex]];

                testPage.waitForDraw();

                runs(function () {
                    expect(selectedListElement.classList.contains("selected")).toBeTruthy();
                });
            });

            it("should continue to allow UI selection after programmatic selection", function () {
                var selectedIndex = 3;
                var selectedListElement = querySelectorAll("ul>li")[selectedIndex];
                nameController.selection = [nameController.organizedContent[selectedIndex]];

                testPage.waitForDraw();

                runs(function () {
                    expect(selectedListElement.classList.contains("selected")).toBeTruthy();

                    var listElementToSelect = querySelectorAll("ul>li")[4];
                    testPage.mouseEvent({target: listElementToSelect}, "mousedown", function () {
                        testPage.mouseEvent({target: listElementToSelect}, "mouseup", function () {
                            expect(listElementToSelect.classList.contains("selected")).toBeTruthy();
                            expect(nameController.selection[4]).toBe(nameController.organizedContent[4]);
                        });
                    });

                });
            });

            it("should mark a newly added and newly selected object as selected", function () {
                testPage.test.addAndSelect();
                testPage.waitForDraw();

                runs(function () {
                    var addedIndex = nameController.content.length - 1;
                    var selectedListElement = querySelectorAll("ul>li")[addedIndex];
                    expect(selectedListElement.classList.contains("selected")).toBeTruthy();
                });
            });

        });

    });
});
