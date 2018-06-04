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
                    expect(dragComponent.isDragSource).toEqual(true);
                    expect(dragComponent.dragManager._dragSources.indexOf(dragComponent) > -1).toEqual(true);
                });

                it("shoud have the class name `montage-drag-source`", function () {
                    expect(dragComponent.classList.has("montage-drag-source")).toEqual(true);
                });

                it("shoud be unregistered when leaving the component tree", function () {
                    dragComponent._exitDocument();
                    expect(dragComponent.dragManager._dragSources.indexOf(dragComponent) === -1).toEqual(true);
                    expect(dragComponent.classList.has("montage-drag-source")).toEqual(false);
                });
            });

            describe("Drag Destination", function () {
                it("shoud be registered within the drag manager ", function () {
                    expect(dropComponent.isDragDestination).toEqual(true);
                    expect(dropComponent.dragManager._dragDestinations.indexOf(dropComponent) > -1).toEqual(true);
                });

                it("shoud have the class name `montage-drag-destination`", function () {
                    expect(dropComponent.classList.has("montage-drag-destination")).toEqual(true);
                });

                it("shoud be unregistered when leaving the component tree", function () {
                    dropComponent._exitDocument();
                    expect(dropComponent.dragManager._dragDestinations.indexOf(dropComponent) === -1).toEqual(true);
                    expect(dropComponent.classList.has("montage-drag-destination")).toEqual(false);
                });
            });
            
        });
    });
});
