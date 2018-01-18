var Component = require("montage/ui/component").Component,
    Promise = require('montage/core/promise');

exports.Main = Component.specialize(/** @lends Main# */{

    constructor: {
        value: function () {
            this.root = {
                filename: '/',
                isDirectory: true,
                children: [
                    {
                        filename: 'a',
                        isDirectory: true,
                        children: [
                            {
                                filename: 'a.1',
                                isDirectory: true,
                                children: [
                                    {
                                        filename: 'a.1.1',
                                        isDirectory: false
                                    },
                                    {
                                        filename: 'a.1.2',
                                        isDirectory: false
                                    }
                                ]
                            },
                            {
                                filename: 'a.2',
                                isDirectory: true,
                                children: [
                                    {
                                        filename: 'a.2.1',
                                        isDirectory: true,
                                        locked: true,
                                        children: []
                                    },
                                    {
                                        filename: 'a.2.2',
                                        isDirectory: false
                                    },
                                    {
                                        filename: 'a.2.3',
                                        isDirectory: false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        filename: 'b',
                        isDirectory: true,
                        children: [
                            {
                                filename: 'b.1',
                                isDirectory: true,
                                children: [
                                    {
                                        filename: 'b.1.1',
                                        isDirectory: true,
                                        children: []
                                    },
                                    {
                                        filename: 'b.1.2',
                                        isDirectory: false
                                    }
                                ]
                            },
                            {
                                filename: 'b.2',
                                isDirectory: true,
                                locked: true,
                                children: [
                                    {
                                        filename: 'b.2.1',
                                        isDirectory: false
                                    },
                                    {
                                        filename: 'b.2.2',
                                        isDirectory: true,
                                        children: []
                                    },
                                    {
                                        filename: 'b.2.3',
                                        isDirectory: false
                                    }
                                ]
                            },
                            {
                                filename: 'b.3',
                                isDirectory: true,
                                children: [
                                    {
                                        filename: 'b.3.1',
                                        isDirectory: false
                                    },
                                    {
                                        filename: 'b.3.2',
                                        isDirectory: true,
                                        children: []
                                    },
                                    {
                                        filename: 'b.3.3',
                                        isDirectory: false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        filename: 'c',
                        isDirectory: true,
                        children: [
                            {
                                filename: 'c.1',
                                isDirectory: true,
                                children: [
                                    {
                                        filename: 'c.1.1',
                                        isDirectory: false
                                    },
                                    {
                                        filename: 'c.1.2',
                                        isDirectory: true,
                                        children: [
                                            {
                                                filename: 'c.1.2.1',
                                                isDirectory: false
                                            },
                                            {
                                                filename: 'c.1.2.2',
                                                isDirectory: false
                                            },
                                            {
                                                filename: 'c.1.2.3',
                                                isDirectory: false
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                filename: 'c.2',
                                isDirectory: true,
                                children: [
                                    {
                                        filename: 'c.2.1',
                                        isDirectory: true,
                                        children: []
                                    },
                                    {
                                        filename: 'c.2.2',
                                        isDirectory: false
                                    },
                                    {
                                        filename: 'c.2.3',
                                        isDirectory: false,
                                        locked: true
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
        }
    },

    enterDocument: {
        value: function () {
            this.addEventListener('orderchange', this);
        }
    },

    handleOrderchange: {
        value: function (event) {
            console.log(event.detail);

            var report = event.detail;

            this.lastActionReport = JSON.stringify({
                node: report.object.filename,
                index: report.index,
                parent: report.parent.filename,
                previousIndex: report.previousIndex,
                previousParent: report.previousParent.filename,
            }, null, 4);
        }
    },

    treeListCanDragNode: {
        value: function (treeList, node, defaultValue) {
            return !node.locked;
        }
    },

    treeListCanDropNode: {
        value: function (treeList, draggingNode, dropNode, defaultValue) {
            return !dropNode.locked;
        }
    }
  
});
