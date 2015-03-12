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
        it("childrenPath should be equal to 'children' by default", function () {
            treeController = new TreeController();
            expect(treeController.childrenPath).toEqual("children");
        });
        it("data should be null if not set", function () {
            treeController = new TreeController();
            expect(treeController.data).toEqual(null);
        });
        it("expandAll should not fail if no data is set", function () {
            treeController = new TreeController();
            treeController.expandAll();
        });
        it("getChildren should work properly if childrenPath is not set", function () {
            expect(treeController.getChildren(treeData)[0].name).toEqual("a");
        });
        it("getChildren should work properly if childrenPath is set as 'children'", function () {
            treeController.childrenPath = "children";
            expect(treeController.getChildren(treeData)[0].name).toEqual("a");
        });
        it("getChildren should work properly if childrenPath is a property literal", function () {
            treeController = new TreeController();
            treeController.childrenPath = "foo";
            treeController.data = {foo: [1]};
            expect(treeController.getChildren(treeController.data)[0]).toEqual(1);
        });
        it("getChildren should work properly if childrenPath is set an FRB expression", function () {
            treeController = new TreeController();
            treeController.childrenPath = "foo.0";
            treeController.data = {foo: [[1]]};
            expect(treeController.getChildren(treeController.data)[0]).toEqual(1);
        });
        it("one change should be handled after setting data for the first time", function () {
            expect(delegate.changes).toEqual(1);
        });
    });

    describe("expanding and collaping the tree", function () {
        it("expandNode should work as expected", function () {
            expect(treeController.expandNode(treeData)).toEqual(true);
            expect(treeController.getNodeIsExpanded(treeData)).toEqual(true);
        });
        it("expandNode should work only on not-expanded nodes", function () {
            expect(treeController.expandNode(treeData)).toEqual(true);
            expect(treeController.expandNode(treeData)).toEqual(false);
            expect(treeController.getNodeIsExpanded(treeData)).toEqual(true);
        });
        it("collapseNode should work as expected", function () {
            treeController.expandNode(treeData);
            expect(treeController.collapseNode(treeData)).toEqual(true);
            expect(treeController.getNodeIsExpanded(treeData)).toEqual(false);
        });
        it("collapseNode should work only onn expanded nodes", function () {
            treeController.expandNode(treeData);
            expect(treeController.collapseNode(treeData)).toEqual(true);
            expect(treeController.collapseNode(treeData)).toEqual(false);
            expect(treeController.getNodeIsExpanded(treeData)).toEqual(false);
        });
        it("expandAll should work as expected", function () {
            treeController.expandAll();
            expect(treeController.getNodeIsExpanded(treeData)).toEqual(true);
            expect(treeController.getNodeIsExpanded(treeData.children[0])).toEqual(true);
            expect(treeController.getNodeIsExpanded(treeData.children[0].children[0])).toEqual(true);
            expect(treeController.getNodeIsExpanded(treeData.children[0].children[0].children[0])).toEqual(false);
            treeController.collapseNode(treeData);
            expect(treeController.getNodeIsExpanded(treeData)).toEqual(false);
            expect(treeController.getNodeIsExpanded(treeData.children[0])).toEqual(true);
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
            treeController.expandAll(treeData);
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
            treeController.expandAll(treeData);
            treeController.collapseNode(treeData);
            treeData.children.push({});
            treeData.children[1].children.push({});
            treeData.children[1].children[0].children.push({});
            expect(delegate.changes).toEqual(3);
        });
        it("no changes if data has been detached", function () {
            treeController.expandAll(treeData);
            treeController.data = {};
            treeData.children.push({});
            treeData.children[1].children.push({});
            treeData.children[1].children[0].children.push({});
            expect(delegate.changes).toEqual(3);
        });
    });

});
