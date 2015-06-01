var TreeController = require("montage/core/tree-controller").TreeController;

describe("tree-controller-spec", function () {

    var treeController,
        treeData,
        delegate;

    beforeEach(function () {
        treeController = new TreeController();
        delegate = {
            changes: 0,
            handleTreeChange: function () {
                this.changes++;
            }
        };
        treeController.delegate = delegate;
        treeController.data =
        treeData = {
            "name": "root",
            "children": [
                {
                    "name": "a",
                    "children": [
                        {
                            "name": "aa",
                            "children": [
                                {"name": "aaa"},
                                {"name": "aab"}
                            ]
                        }
                        ,
                        {
                            "name": "ab",
                            "children": [
                                {"name": "aba"},
                                {"name": "abb"}
                            ]
                        },
                        {
                            "name": "ac",
                            "children": [
                                {"name": "aca"},
                                {"name": "acb"}
                            ]
                        }
                    ]
                },
                {
                    "name": "b",
                    "children": [
                        {
                            "name": "ba",
                            "children": [
                                {"name": "baa"},
                                {"name": "bab"}
                            ]
                        },
                        {
                            "name": "bb",
                            "children": [
                                {"name": "bba"},
                                {"name": "bbb"}
                            ]
                        },
                        {
                            "name": "bc",
                            "children": [
                                {"name": "bca"},
                                {"name": "bcb"}
                            ]
                        }
                    ]
                }
            ]
        };
    });

    describe("initialisation and configuration", function () {
        it("childrenExpression should be equal to 'children' by default", function () {
            treeController = new TreeController();
            expect(treeController.childrenExpression).toEqual("children");
        });
        it("data should be null if not set", function () {
            treeController = new TreeController();
            expect(treeController.data).toEqual(null);
        });
        it("expandAll should not fail if no data is set", function () {
            treeController = new TreeController();
            treeController.expandAll();
        });
        it("childrenFromNode should work properly if childrenExpression is not set", function () {
            expect(treeController.childrenFromNode(treeData)[0].name).toEqual("a");
        });
        it("childrenFromNode should work properly if childrenExpression is set as 'children'", function () {
            treeController.childrenExpression = "children";
            expect(treeController.childrenFromNode(treeData)[0].name).toEqual("a");
        });
        it("childrenFromNode should work properly if childrenExpression is a property literal", function () {
            treeController = new TreeController();
            treeController.childrenExpression = "foo";
            treeController.data = {foo: [1]};
            expect(treeController.childrenFromNode(treeController.data)[0]).toEqual(1);
        });
        it("childrenFromNode should work properly if childrenExpression is set an FRB expression", function () {
            treeController = new TreeController();
            treeController.childrenExpression = "foo.0";
            treeController.data = {foo: [[1]]};
            expect(treeController.childrenFromNode(treeController.data)[0]).toEqual(1);
        });
        it("one change should be handled after setting data for the first time", function () {
            expect(delegate.changes).toEqual(1);
        });
    });

    describe("expanding and collaping the tree", function () {
        it("expandNode should work as expected", function () {
            expect(treeController.expandNode(treeData)).toEqual(true);
            expect(treeController.isNodeExpanded(treeData)).toEqual(true);
        });
        it("expandNode should work only on not-expanded nodes", function () {
            expect(treeController.expandNode(treeData)).toEqual(true);
            expect(treeController.expandNode(treeData)).toEqual(false);
            expect(treeController.isNodeExpanded(treeData)).toEqual(true);
        });
        it("expandNode should return false if provided node is not an object", function () {
            expect(treeController.expandNode()).toEqual(false);
        });
        it("collapseNode should work as expected", function () {
            treeController.expandNode(treeData);
            expect(treeController.collapseNode(treeData)).toEqual(true);
            expect(treeController.isNodeExpanded(treeData)).toEqual(false);
        });
        it("collapseNode should work only onn expanded nodes", function () {
            treeController.expandNode(treeData);
            expect(treeController.collapseNode(treeData)).toEqual(true);
            expect(treeController.collapseNode(treeData)).toEqual(false);
            expect(treeController.isNodeExpanded(treeData)).toEqual(false);
        });
        it("collapseNode should return false if provided node is not an object", function () {
            expect(treeController.collapseNode()).toEqual(false);
        });
        it("expandAll should work as expected", function () {
            treeController.expandAll();
            expect(treeController.isNodeExpanded(treeData)).toEqual(true);
            expect(treeController.isNodeExpanded(treeData.children[0])).toEqual(true);
            expect(treeController.isNodeExpanded(treeData.children[0].children[0])).toEqual(true);
            expect(treeController.isNodeExpanded(treeData.children[0].children[0].children[0])).toEqual(false);
            treeController.collapseNode(treeData);
            expect(treeController.isNodeExpanded(treeData)).toEqual(false);
            expect(treeController.isNodeExpanded(treeData.children[0])).toEqual(true);
        });
    });

    describe("handling changes in the tree", function () {
        it("a change if data property changes", function () {
            treeController.data = {};
            expect(delegate.changes).toEqual(2);
        });
        it("a change after expanding the root", function () {
            treeController.expandNode(treeData);
            expect(delegate.changes).toEqual(2);
        });
        it("no changes after trying to expand the same node again", function () {
            treeController.expandNode(treeData);
            treeController.expandNode(treeData);
            expect(delegate.changes).toEqual(2);
        });
        it("a change after expandAll", function () {
            treeController.expandAll();
            expect(delegate.changes).toEqual(2);
        });
        it("a change after collapseNode", function () {
            treeController.expandNode(treeData);
            treeController.collapseNode(treeData);
            expect(delegate.changes).toEqual(3);
        });
        it("no changes after trying to collapse the same node again", function () {
            treeController.expandNode(treeData);
            treeController.collapseNode(treeData);
            treeController.collapseNode(treeData);
            expect(delegate.changes).toEqual(3);
        });
        it("a change when data's children change", function () {
            treeController.expandNode(treeData);
            treeData.children.push({});
            expect(delegate.changes).toEqual(3);
            treeData.children.pop();
            expect(delegate.changes).toEqual(4);
            treeData.children = null;
            expect(delegate.changes).toEqual(5);
        });
        it("a change when data descendants change", function () {
            treeController.expandAll();
            treeData.children[0].children.push({});
            expect(delegate.changes).toEqual(3);
            treeData.children[1].children.pop();
            expect(delegate.changes).toEqual(4);
            treeData.children[1].children[0].children = null;
            expect(delegate.changes).toEqual(5);
        });
        it("no changes if changed children have never been reachable", function () {
            treeData.children.push({});
            expect(delegate.changes).toEqual(1);
        });
        it("no changes if changed children have been reachable but not anymore", function () {
            treeController.expandAll();
            treeController.collapseNode(treeData);
            treeData.children.push({});
            treeData.children[1].children.push({});
            treeData.children[1].children[0].children.push({});
            expect(delegate.changes).toEqual(3);
        });
        it("no changes if data has been detached", function () {
            treeController.expandAll();
            treeController.data = {};
            treeData.children.push({});
            treeData.children[1].children.push({});
            treeData.children[1].children[0].children.push({});
            expect(delegate.changes).toEqual(3);
        });
        it("changes are registered for FRB paths", function () {
            delegate.changes = 0;
            treeController = new TreeController();
            treeController.delegate = delegate;
            treeController.childrenExpression = "foo.0";
            treeController.data = {foo: [[{}]]};
            treeController.expandNode(treeController.data);
            treeController.data.foo[0].push({});
            expect(delegate.changes).toEqual(3);
        });
        it("changes are registered for complex FRB expressions", function () {
            delegate.changes = 0;
            treeController = new TreeController();
            treeController.delegate = delegate;
            treeController.data =
            treeData = {
                left: {
                    left: {},
                    right: {}
                },
                right: {
                    left: {},
                    right: {}
                }
            };
            treeController.childrenExpression = "(left ? [left] : []).concat(right ? [right] : [])";
            treeController.expandNode(treeData);
            treeController.expandNode(treeData.left);
            expect(delegate.changes).toEqual(3);
            treeData.left.right = null;
            expect(delegate.changes).toEqual(4);
            treeData.left = null;
            expect(delegate.changes).toEqual(5);
            treeData.left = {};
            treeController.expandNode(treeData.left);
            expect(delegate.changes).toEqual(7);
            treeData.left.left = {};
            expect(delegate.changes).toEqual(8);
        });
    });

});
