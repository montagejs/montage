var Montage = require("./core").Montage,
    WeakMap = require("collections/weak-map"),
    parse = require("frb/parse"),
    evaluate = require("frb/evaluate");

var TreeNode = exports.TreeNode = Montage.specialize({

    constructor: {
        value: function (data, controller) {
            this.data = data;
            this.controller = controller;
        }
    },

    isExpanded: {
        get: function () {
            return this.controller.isNodeExpanded(this.data);
        },
        set: function (value) {
            if (value) {
                this.controller.expandNode(this.data);
            } else {
                this.controller.collapseNode(this.data);
            }
        }
    }

});


exports.TreeController = Montage.specialize({

    constructor: {
        value: function () {
            this._listenersHash = {};
            this._listenersCounter = 0;
        }
    },

    _childrenExpressionProperty: {
        value: "children"
    },

    _childrenExpression: {
        value: null
    },

    /**
     * An FRB expression, that evaluated against content or any of its
     * children, produces an array of that content's children.
     * By default it is "children"
     */
    childrenExpression: {
        get: function () {
            if (this._childrenExpression === null) {
                return "children";
            }
            return this._childrenExpression;
        },
        set: function (value) {
            if (this._childrenExpression !== value) {
                var parsedValue = null;

                this._childrenExpression = value;
                if (value) {

                    // We parse the given childrenExpression...

                    if (typeof value === "string") {
                        parsedValue = parse(value);
                    }

                    // ...and if it is just a property we set _childrenExpressionProperty
                    //  to be used later for speed optimisation purposes

                    if ((parsedValue !== null) &&
                        (parsedValue.type === "property") &&
                        (parsedValue.args) &&
                        (parsedValue.args.length === 2) &&
                        (parsedValue.args[0].type === "value") &&
                        (parsedValue.args[1].type === "literal")) {
                        this._childrenExpressionProperty = parsedValue.args[1].value;
                    } else {
                        this._childrenExpressionProperty = null;
                    }
                } else {
                    this._childrenExpressionProperty = "children";
                }
            }
        }
    },

    /**
     * Whether nodes in the tree should be expanded by default.
     * This will only apply when the tree's [data]{@link TreeController#data}
     * property is set. Nodes added dynamically will ignore this flag.
     *
     * @type boolean
     */
    initiallyExpanded: {
        value: false
    },

    _data: {
        value: null
    },

    /**
     * Tree data model / root
     */
    data: {
        get: function () {
            return this._data;
        },
        set: function (value) {
            if (this._data !== value) {
                this._expansionMap = new WeakMap();
                this._data = value;
                if (this.initiallyExpanded) {
                    this.expandAll();
                } else {
                    this.handleTreeChange();
                }
            }
        }
    },

    /**
     * Calls handleTreeChange in delegate when nodes
     * are expanded/collapsed and when data changes
     */
    handleTreeChange: {
        value: function () {
            if (!this._isOwnUpdate) {
                this._updateListeners();
                if (this.delegate && this.delegate.handleTreeChange) {
                    this.delegate.handleTreeChange();
                }
            }
        }
    },

    _expandNode: {
        value: function (node) {
            if (!this.isNodeExpanded(node)) {
                this._expansionMap.set(node, {});
                return true;
            }
            return false;
        }
    },

    /**
     * Expands a given node of the tree
     */
    expandNode: {
        value: function (node) {
            if (typeof node === "object" && this._expandNode(node)) {
                this.handleTreeChange();
                return true;
            }
            return false;
        }
    },

    _expandAll: {
        value: function (node) {
            var childrenData = this.childrenFromNode(node),
                length,
                i;

            if (childrenData) {
                length = childrenData.length;
                if (length) {
                    this._expandNode(node);
                    for (i = 0; i < length; i++) {
                        this._expandAll(childrenData[i]);
                    }
                }
            }
        }
    },

    /**
     * Expands all nodes with children in the tree.
     */
    expandAll: {
        value: function () {
            if (this._data) {
                this._expandAll(this._data);
                this.handleTreeChange();
            }
        }
    },

    _collapseNode: {
        value: function (node) {
            return this._expansionMap.delete(node);
        }
    },

    /**
     * Collapses a given node of the tree
     */
    collapseNode: {
        value: function (node) {
            if (typeof node === "object" && this._collapseNode(node)) {
                this.handleTreeChange();
                return true;
            }
            return false;
        }
    },

    /**
     * Collapses all nodes with children in the tree.
     */
    collapseAll: {
        value: function () {
            this._expansionMap = new WeakMap();
            this.handleTreeChange();
            return true
        }
    },

    /**
     * Gets the node expansion value - boolean - for a given node
     */
    isNodeExpanded: {
        value: function (node) {
            return this._expansionMap.has(node);
        }
    },

    /**
     * Returns the children of a given node based on childrenExpression
     */
    childrenFromNode: {
        value: function (node) {

            // This is a speed optimisation. If childrenExpression
            // is just a single property, we don't evaluate it

            if (this._childrenExpressionProperty === null) {
                return evaluate(this._childrenExpression, node);
            }
            return node[this._childrenExpressionProperty];
        }
    },

    _getReachableExpandedNodes: {
        value: function (node, result) {
            var expansionMetadata,
                children,
                length,
                i;

            if (!result) {
                result = [];
            }
            if (node && (expansionMetadata = this._expansionMap.get(node))) {
                result.push(node);
                children = this.childrenFromNode(node);
                if (children) {
                    length = children.length;
                    for (i = 0; i < length; i++) {
                        this._getReachableExpandedNodes(children[i], result);
                    }
                }
            }
            return result;
        }
    },

    _addListener: {
        value: function (expandedNode) {
            var expansionMetadata = this._expansionMap.get(expandedNode),
                treeNode,
                cancelListener;

            this._isOwnUpdate = true;
            treeNode = new TreeNode(expandedNode, this);
            cancelListener = treeNode.addRangeAtPathChangeListener(
                this._childrenExpression ? "data.path(controller._childrenExpression)" : "data.children",
                this,
                "handleTreeChange"
            );
            this._isOwnUpdate = false;
            this._listenersCounter++;
            this._listenersHash[this._listenersCounter] = {
                cancelListener: cancelListener,
                node: expandedNode
            };
            expansionMetadata.listenerId = this._listenersCounter;
            return this._listenersCounter;
        }
    },

    _removeListener: {
        value: function (id) {
            var expandedNode = this._listenersHash[id].node,
                expansionMetadata = this._expansionMap.get(expandedNode);

            this._listenersHash[id].cancelListener();
            if (expansionMetadata) {
                delete expansionMetadata.listenerId;
            }
        }
    },

    _updateListeners: {
        value: function () {
            var reachableExpandedNodes = this._getReachableExpandedNodes(this._data),
                expansionMetadata,
                length = reachableExpandedNodes.length,
                listenersHash = {},
                listenersIds = [],
                id,
                i;

            for (i = 0; i < length; i++) {
                expansionMetadata = this._expansionMap.get(reachableExpandedNodes[i]);
                if (expansionMetadata.listenerId) {
                    listenersIds.push(expansionMetadata.listenerId);
                } else {
                    listenersIds.push(
                        this._addListener(reachableExpandedNodes[i])
                    );
                }
                listenersHash[expansionMetadata.listenerId] = this._listenersHash[expansionMetadata.listenerId];
                delete this._listenersHash[expansionMetadata.listenerId];
            }
            for (id in this._listenersHash) {
                this._removeListener(id);
            }
            this._listenersHash = listenersHash;
        }
    }

});
