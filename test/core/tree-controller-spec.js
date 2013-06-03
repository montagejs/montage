
var TreeController = require("montage/core/tree-controller").TreeController;

describe("core/tree-controller-spec", function () {

    var tree = {
        name: "X",
        children: [
            {
                "name": "Y"
            },
            {
                "name": "Z",
                children: [
                    {
                        name: "A"
                    }
                ]
            }
        ]
    };

    it("should vary visible iterations with expand and collapse", function () {

        var node = new TreeController().init(tree, "children");

        expect(node.length).toBe(1);
        expect(node.iterations.map(function (iteration) {
            return iteration.depth
        })).toEqual([0]);

        node.expanded = true;
        expect(node.length).toBe(3); // + 2 unexpanded children
        expect(node.iterations.map(function (iteration) {
            return iteration.depth
        })).toEqual([0, 1, 1]);

        node.childNodes[1].expanded = true;
        expect(node.length).toBe(4); // + 1 grandchild
        expect(node.iterations.map(function (iteration) {
            return iteration.depth
        })).toEqual([0, 1, 1, 2]);

        node.expanded = false;
        expect(node.length).toBe(1); // dispite children and grandchildren
        expect(node.iterations.map(function (iteration) {
            return iteration.depth
        })).toEqual([0]);

    });

});

