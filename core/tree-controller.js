var Montage = require("./core").Montage;
var Map = require("collections/map");
var WeakMap = require("collections/weak-map");
var Object = require("collections/shim-object");

/**
 * @class TreeControllerNode
 * @extends Montage
 * @description A tree controller is a view-model that tracks whether each node in a
 * corresponding data-model is expanded or collapsed.  It also produces a
 * linearization of the visible iterations, transforming hierachical nesting
 * into a flat, incrementally-updated array of iterations with the
 * corresponding indentation depth.
 * Bind a root node from the data model to a tree controller and bind the tree
 * controller's iterations to a content controller for a repetition.
 */
var Node = exports.TreeControllerNode = Montage.specialize( /** @lends TreeControllerNode# */ {

    /**
     * The only meaningful user-defined state for this tree view, whether the
     * node is expanded (or collapsed).
     */
    expanded: {
        value: true
    },

    /**
     * The data model corresponding to this node.
     */
    content: {
        value: null
    },

    /**
     * The number of times this node should be indented to reach its visually
     * representative depth.  This property or `junctions` are alternately
     * useful for tree visualization strategies.
     */
    depth: {
        value: null
    },

    /**
     * The position of this node within the parent node, as maintained by
     * bindings.
     */
    index: {
        value: null
    },

    /**
     * Whether this node appears in the last position of the parent node's
     * children, as maintained by bindings.
     */
    isFinal: {
        value: null
    },

    /**
     * The node that is this node's parent, or null if this is the root node.
     */
    parent: {
        value: null
    },

    /**
     * The child nodes is an array of the corresponding tree controller
     * view-model node for each of the children.  The child nodes array
     * is maintained by `handleChildrenEntriesRangeChange`.
     */
    children: {
        value: null
    },

    /**
     * The governing content controller
     */
    _controller: {
        value: null
    },

    /**
     * An array of the children of the content for this node.  The content
     * itself may hang its children however it likes, but this will always be a
     * simple array, observed using the `childrenPath` provided to the tree
     * controller upon initialization.
     * @private
     */
    _childrenContent: {
        value: null
    },

    /**
     * The child entries are an array bound to an enumeration of its children
     * collection.  The enumeration produces entries objects (duples of [index,
     * child]).  The node watches this array for changes and reacts by producing
     * corresponding child nodes, passing the entry object to the node so that
     * it can watch its own index within the parent node's children.  Watching
     * the index is important for judging whether it is in final position,
     * which is in turn useful for determining the junction type to associate
     * with the node.
     * @private
     */
    _childrenEntries: {
        value: null
    },

    /**
     * The iterations array contains this node and all of its children beneath
     * expanded nodes.  It is maintained entirely by a binding that involves
     * this node, its child nodes, the iterations of its child nodes, and
     * whether this node is expanded.
     */
    iterations: {
        value: null
    },

    /**
     * An array of hints for what kind of line art needs to be employed
     * for each level of indentation leading up to this node's content.  The
     * hints include "final", "medial", "before", and "after".  The "final"
     * hint implies a junction that leads from above to the content to the
     * right.  The "medial" hint implies a junction that follows from above and
     * continues down, with a line to content to the right.  The "before" hint
     * implies a junction that passed from above to below.  The "after" hint
     * implies a junction with no lines at all.  The junctions array reacts
     * synchronous to content changes.
     */
    junctions: {
        value: null
    },

    /**
     * The last junction on this node's row, as determined solely by whether it
     * is in final position by its immediate parent.
     * @private
     */
    _junction: {
        value: null
    },

    /**
     * The penultimate junction on each of this node's children, as determined
     * solely by whether it is in final position of its parent.
     * @private
     */
    _followingJunction: {
        value: null
    },

    /**
     * All of the junctions that prefix each of this node's children's
     * junctions.
     * @private
     */
    _followingJunctions: {
        value: null
    },

    /**
     * An [index, node] duple maintained by an enumeration binding on this
     * node's parent's children.  The object exists to provide the `index` for
     * this node, which in turn propagates out to the `initial` and `final`
     * properties.
     * @private
     */
    _entry: {
        value: null
    },

    /**
     * Creates a tree controller node.
     * @param content
     * @param {string} childenPath
     * @param {Node} parent
     * @param {number} depth
     * @param {[Number, Node]|null} entry
     */
    constructor: {
        value: function TreeControllerNode(controller, parent, content, depth, entry) {
            this.super();

            this._controller = controller;
            this.parent = parent;
            this.content = content;
            this.depth = depth;
            this._entry = entry || [0, this];
            this.expanded = controller.initiallyExpanded || false;

            this.children = [];

            this.defineBinding("index", {"<-": "_entry.0"});
            this.defineBinding("isFinal", {"<-": "index == parent.children.length - 1"});

            // childrenPath -> _childrenContent
            // waits for depth to be defined to ensure that child nodes know
            // their depth when they are created by initialization of children
            this.defineBinding("_childrenContent", {
                "<-": "depth.defined() ? content.path(_controller.childrenPath ?? 'children') : []"
            });

            // _childrenContent -> _childrenEntries
            this.defineBinding("_childrenEntries", {
                "<-": "_childrenContent.enumerate()"
            });

            // _childrenEntries -> children
            this.handleChildrenEntriesRangeChange(this._childrenEntries, [], 0);
            this._childrenEntries.addRangeChangeListener(this, "childrenEntries");

            // this + children if expanded -> iterations
            this.defineBinding("iterations", {
                "<-": "[this].concat(expanded ? children.flatten{iterations} : [])"
            });

            // the all nodes binding facilitates the allExpanded binding
            this.defineBinding("nodes", {
                "<-": "[this].concat(children.flatten{nodes})"
            });

            // line art hints
            this.defineBinding("_junction", {
                "<-": "isFinal ? 'final' : 'medial'"
            });
            this.defineBinding("_followingJunction", {
                "<-": "isFinal ? 'after' : 'before'"
            });
            this.defineBinding("_followingJunctions", {
                "<-": "(parent._followingJunctions ?? []).concat([_followingJunction])"
            });
            this.defineBinding("junctions", {
                "<-": "(parent._followingJunctions ?? []).concat([_junction])"
            });

        }
    },

    /**
     * Finds and return the node having the given content.
     * Takes an optional second argument to specify the compare function to use.
     * note: If you are doing find operations frequently, it might be better to attach
     * a binding that will facilitate incremental updates and O(1) lookups.
     * `nodeForContent <- nodes{[content, this]}.toMap()`
     */
    findNodeByContent: {
        value: function (content, equals) {
            equals = equals || Object.is;
            if (equals(this.content, content)) {
                return this;
            }
            var node;
            for (var i = 0; i < this.children.length; i++) {
                if (node = this.children[i].findNodeByContent(content, equals)) {
                    break;
                }
            }
            return node;
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called before continuing the walk on its children.
     */
    preOrderWalk: {
        value: function (callback) {
            callback(this);
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].preOrderWalk(callback);
            }
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called after continuing the walk on its children.
     */
    postOrderWalk: {
        value: function (callback) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].postOrderWalk(callback);
            }
            callback(this);
        }
    },

    /**
     * Propagates changes to `_childrenEntries` (by way of `_childrenContent.enumerate()`)
     * into `children`, by constructing the respective node for each child.
     * @private
     */
    handleChildrenEntriesRangeChange: {
        value: function (plus, minus, index) {
            this.children.swap(
                index,
                minus.length,
                plus.map(function (entry) {
                    return new this.constructor(
                        this._controller,
                        this,
                        entry[1], // content
                        this.depth + 1,
                        entry
                    );
                }, this)
            );
        }
    }

});


/**
 * @class TreeController
 */
exports.TreeController = Montage.specialize( /** @lends TreeController# */ {

    /**
     * The input of a tree controller, an object to serve at the root of the
     * tree.
     */
    content: {
        value: null
    },

    /**
     * An FRB expression, that evaluated against content or any of its
     * children, produces an array of that content's children.  By default,
     * this is simply "children", but for an alternate example, a binary tree
     * would have children `[left, right]`, except that said tree would need to
     * have no children if left and right were both null, so `(left ??
     * []).concat(right ?? [])`, to avoid infinite recursion.
     *
     * This property must be set before `content`.
     */
    childrenPath: {
        value: null
    },

    /**
     * Whether nodes of the tree are initially expanded.
     *
     * This property must be set before `content`.  If `content` has already
     * set, use `allExpanded`.
     */
    initiallyExpanded: {
        value: null
    },

    /**
     * Whether every node eligible for expansion is expanded.
     *
     * This is a readable and writable property.  Setting to true causes all
     * nodes to be expanded.
     */
    allExpanded: {
        value: null
    },

    /**
     * Whether any nodes are collapsed.
     *
     * This is a readable and writable property.  Setting to true causes all
     * nodes to be collapsed.
     */
    noneExpanded: {
        value: null
    },

    /**
     * The product of a tree controller, an array of tree controller nodes
     * corresponding to each branch of the content for which every parent node
     * is `expanded`.
     */
    iterations: {
        value: null
    },

    /**
     * A by-product of the tree controller, the root node of the tree for the
     * current content.
     */
    root: {
        value: null
    },

    /**
     * A WeakMap of alternate [content, root] pairs.  If the content is
     * dropped, the view-model (tree controller nodes) may be collected.  If a
     * content references is restored, the corresponding view model and all of
     * its expanded/collapsed state, is restored.
     * @private
     */
    _roots: {
        value: null
    },

    /**
     * Creates a tree controller.
     */
    constructor: {
        value: function TreeController(content, childrenPath, initiallyExpanded) {
            this.super();

            this._roots = new WeakMap();
            this.addOwnPropertyChangeListener("content", this);
            this.defineBinding("iterations", {"<-": "root.iterations"});
            this.defineBinding("nodes", {"<-": "root.nodes"});
            this.defineBinding(
                "allExpanded",
                {"<->": "nodes.every{expanded || children.length == 0}"}
            );
            this.defineBinding(
                "noneExpanded",
                {"<->": "nodes.every{!expanded}"}
            );

            this.initiallyExpanded = initiallyExpanded;
            this.childrenPath = childrenPath;
            this.content = content;
        }
    },

    /**
     * Memoizes content to tree controller root nodes, using the `_roots`
     * `WeakMap` to retain `expanded` / collapsed state.
     * @private
     */
    handleContentChange: {
        value: function (content) {
            if (!content) {
                this.root = null;
                return;
            }
            if (!this._roots.has(content)) {
                this._roots.set(
                    content,
                    new this.Node(
                        this, // controller
                        null, // parent
                        content,
                        0, // depth
                        null // entry
                    )
                );
            }
            this.root = this._roots.get(content);
        }
    },

    /**
     * @type TreeControllerNode
     */
    Node: {
        value: Node
    },

    /**
     * Finds and returns the node having the given content.
     * Takes an optional second argument to specify the compare function to use.
     * note: If you are doing find operations frequently, it might be better to attach
     * a binding that will facilitate incremental updates and O(1) lookups.
     * `nodeForContent <- nodes{[content, this]}.toMap()`
     */
    findNodeByContent: {
        value: function(content, equals) {
            if (this.root) {
                return  this.root.findNodeByContent(content, equals);
            }
            else {
                return null;
            }
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called before continuing the walk on its children.
     */
    preOrderWalk: {
        value: function(callback) {
            if (this.root) {
                this.root.preOrderWalk(callback);
            }
        }
    },

    /**
     * Performs a traversal of the tree, executes the callback function for each node.
     * The callback is called after continuing the walk on its children.
     */
    postOrderWalk: {
        value: function(callback) {
            if (this.root) {
                this.root.postOrderWalk(callback);
            }
        }
    }

}, {

    blueprintModuleId:require("./core")._blueprintModuleIdDescriptor,

    blueprint:require("./core")._blueprintDescriptor

});

