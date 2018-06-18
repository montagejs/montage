// "use strict"; // TODO: causes q to throw, will reinstate when q is replaced by bluebird

var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("drag-test", function (testPage) {
    describe("core/drag/drag-spec", function () {
        var dragElement;
        var dragComponent;
        var dropElement;
        var dropComponent;

        beforeEach(function () {
            dragElement = testPage.getElementById("drag");
            dragComponent = dragElement.component;
            dropElement = testPage.getElementById("drop");
            dropComponent = dropElement.component;
        });

        describe("Drag Manager", function () {

            describe("Drag Source", function () {
                it("shoud be registered within the drag manager", function () {
                    expect(dragComponent.draggable).toEqual(true);
                    expect(dragComponent.dragManager._draggables.indexOf(dragComponent) > -1).toEqual(true);
                });

                it("shoud have the class name `montage-draggable`", function () {
                    expect(dragComponent.classList.has("montage-draggable")).toEqual(true);
                });

                it("shoud be unregistered when leaving the component tree", function () {
                    dragComponent._exitDocument();
                    expect(dragComponent.dragManager._draggables.indexOf(dragComponent) === -1).toEqual(true);
                    expect(dragComponent.classList.has("montage-draggable")).toEqual(false);
                });
            });

            describe("Drag Destination", function () {
                it("shoud be registered within the drag manager ", function () {
                    expect(dropComponent.droppable).toEqual(true);
                    expect(dropComponent.dragManager._droppables.indexOf(dropComponent) > -1).toEqual(true);
                });

                it("shoud have the class name `montage-droppable`", function () {
                    expect(dropComponent.classList.has("montage-droppable")).toEqual(true);
                });

                it("shoud be unregistered when leaving the component tree", function () {
                    dropComponent._exitDocument();
                    expect(dropComponent.dragManager._droppables.indexOf(dropComponent) === -1).toEqual(true);
                    expect(dropComponent.classList.has("montage-droppable")).toEqual(false);
                });
            });
            
        });
    });
});
