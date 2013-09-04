
var TreeController = require("montage/core/tree-controller").TreeController;
var Object = require("../collections/shim-object");

Error.stackTraceLimit = Infinity;

describe("core/tree-controller-spec", function () {

    describe("default children structure", function () {
        var tree,
            root,
            treeController;

        beforeEach(function () {
            tree = {
                name: "I",
                children: [
                    {
                        "name": "I/A",
                        children: []
                    },
                    {
                        "name": "I/B",
                        children: [
                            {
                                name: "I/B/1"
                            }
                        ]
                    }
                ]
            };
        });

        describe("expand and collapse", function () {

            it("initialize", function () {
                treeController = new TreeController();
                treeController.content = tree;
                root = treeController.root;

                expect(treeController.iterations.map(function (iteration) {
                    return iteration.content.name;
                })).toEqual(['I']);
            });

            it("expand the root", function () {
                root.expanded = true;
                // + 2 unexpanded children
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.content.name;
                })).toEqual(['I', 'I/A', 'I/B']);
            });

            it("expand the left child", function () {
                root.children[1].expanded = true;
                // + 1 grandchild
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.content.name;
                })).toEqual(['I', 'I/A', 'I/B', 'I/B/1']);
            });

            it("collapse the root", function () {
                root.expanded = false;
                // dispite children and grandchildren
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.content.name;
                })).toEqual(['I']);
            });

        });

        describe("iteration depths", function () {
            it("initialize", function () {
                treeController = new TreeController();
                treeController.content = tree;
                root = treeController.root;

                expect(treeController.iterations.map(function (iteration) {
                    return iteration.depth
                })).toEqual([0]);
            });

            it("expand the root", function () {
                root.expanded = true;
                // + 2 unexpanded children
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.depth
                })).toEqual([0, 1, 1]);
            });

            it("expand the left child", function () {
                root.children[1].expanded = true;
                // + 1 grandchild
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.depth
                })).toEqual([0, 1, 1, 2]);
            });

            it("collapse the root", function () {
                root.expanded = false;
                // dispite children and grandchildren
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.depth
                })).toEqual([0]);
            });

        });

        describe("model changes", function () {

            it("initialize", function () {
                treeController = new TreeController();
                treeController.initiallyExpanded = true;
                treeController.content = tree;
                root = treeController.root;

                expect(treeController.iterations.map(function (iteration) {
                    return iteration.content.name;
                })).toEqual([
                    'I', 'I/A', 'I/B', 'I/B/1'
                ]);
            });

            it("add child to model", function () {
                root.children[0].content.children.push({
                    name: 'I/A/1',
                    children: []
                });
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.content.name;
                })).toEqual([
                    'I', 'I/A', 'I/A/1', 'I/B', 'I/B/1'
                ]);
            });

            it("remove child from model", function () {
                root.children[1].children = null;
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.content.name;
                })).toEqual([
                    'I', 'I/A', 'I/A/1', 'I/B'
                ]);
            });

            it("detach model", function () {
                treeController.content = null;
                expect(treeController.iterations).toBe(undefined);
            });

        });

        describe("view model per content", function () {

            var previous;
            it("should have a fresh view model for a new root", function () {
                treeController = new TreeController();
                treeController.content = tree;
                previous = tree;
                treeController.root.expanded = true;
                expect(treeController.nodes.map(function (iteration) {
                    return iteration.expanded;
                })).toEqual([true, false, false, false]);

                treeController.content = {
                    name: 'X',
                    children: [
                        {name: 'Y'}
                    ]
                };
                expect(treeController.nodes.map(function (iteration) {
                    return iteration.expanded;
                })).toEqual([false, false]);
            });

            it("should restore previous view model", function () {
                treeController.content = previous;
                expect(treeController.nodes.map(function (iteration) {
                    return iteration.expanded;
                })).toEqual([true, false, false, false]);
            });

        });

        describe("iteration junctions", function () {
            it("initialize", function () {
                treeController = new TreeController();
                treeController.content = tree;
                tree.children[0].children = [{
                    name: "I/A/1"
                }, {
                    name: "I/A/2"
                }, {
                    name: "I/A/3"
                }];
                treeController.allExpanded = true;
                var ascii = {
                    "medial": " +-",
                    "final": " ^-",
                    "before": " | ",
                    "after": "   "
                };
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.junctions.map(function (junction) {
                        return ascii[junction];
                    }).join("") + " " + iteration.content.name;
                })).toEqual([
                    " I",
                    " +- I/A",
                    " |  +- I/A/1",
                    " |  +- I/A/2",
                    " |  ^- I/A/3",
                    " ^- I/B",
                    "    ^- I/B/1"
                ]);
            });
        });

        describe("find node by content", function (){
            it("find node by content from root", function () {
                treeController = new TreeController();
                treeController.content = tree;
                root = treeController.root;
                var seek = tree.children[1];
                node = root.findNodeByContent(seek);
                expect(node.content).toBe(seek);
            });

            it("find node by content from treeController with Object.equals", function () {
                treeController = new TreeController();
                treeController.content = tree;
                root = treeController.root;
                var seek = tree.children[1].children[0];
                node = treeController.findNodeByContent(seek, Object.equals);
                expect(node.content).toBe(seek);
            });
        });

        // 4 + 2 * 2 -> pre= +4*22; post= 422+*
        describe("walk tree", function(){
            var ast = {
                value: "+",
                children: [{
                    value: "4",
                    children: []
                },
                {
                    value: "*",
                    children: [{
                        value: "2",
                        children: []
                    },
                    {
                        value: "2",
                        children: []
                    },
                    ]
                }]
            };
            treeController = new TreeController();
            treeController.content = ast;
            var res = "";
            treeController.preOrderWalk(function(node){
                res +=  node.content.value;
            });
            expect(res).toBe("+4*22");

            res = "";
            treeController.postOrderWalk(function(node){
                res +=  node.content.value;
            });
            expect(res).toBe("422*+");
        });

    });

    describe("trees with alternate structures", function () {

        var tree;

        beforeEach(function () {
            tree = {
                value: 10,
                left: {
                    value: 20,
                    left: {
                        value: 30
                    }
                },
                right: {
                    value: 40,
                    left: {
                        value: 50
                    }
                }
            };
        });

        var childrenPath =  "[left, right].filter{defined()}";

        describe("handle an alternate childrenPath", function () {
            var treeController;

            it("initialize unexpanded per default", function () {
                treeController = new TreeController();
                treeController.childrenPath = childrenPath;
                treeController.content = tree;
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.getPath("content.value");
                })).toEqual([10]);
            });

            it("show immediate children only on expanding the root", function () {
                treeController.root.expanded = true;
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.getPath("content.value");
                })).toEqual([10, 20, 40]);
            });

            it("show the left node's children", function () {
                treeController.root.children[0].expanded = true;
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.getPath("content.value");
                })).toEqual([10, 20, 30, 40]);
            });

            it("show the right node's children", function () {
                treeController.root.children[1].expanded = true;
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.getPath("content.value");
                })).toEqual([10, 20, 30, 40, 50]);
            });

            it("show only the root if the root is collapsed", function () {
                treeController.root.expanded = false;
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.getPath("content.value");
                })).toEqual([10]);
            });

            it("retain the inner expansion state when expanded again", function () {
                treeController.root.expanded = true;
                expect(treeController.iterations.map(function (iteration) {
                    return iteration.getPath("content.value");
                })).toEqual([10, 20, 30, 40, 50]);
            });
        });

        it("be configurable as expanded", function () {
            var treeController = new TreeController();
            treeController.childrenPath = childrenPath;
            treeController.content = tree;
            treeController.allExpanded = true;

            expect(treeController.iterations.map(function (iteration) {
                return iteration.getPath("content.value");
            })).toEqual([10, 20, 30, 40, 50]);
        });

    });

});

