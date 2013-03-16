
var Montage = require("core/core").Montage;

// A tree controller is a view-model that tracks whether each node in a
// corresponding data-model is expanded or collapsed.  It also produces a
// linearization of the visible iterations, transforming hierachical nesting
// into a flat, incrementally-updated array of iterations with the
// corresponding indentation depth.

// Bind a root node from the data model to a tree controller and bind the tree
// controller's iterations to a content controller for a repetition.

var Iteration = Montage.create(Montage, {

    didCreate: {
        value: function () {
            this.depth = null;
            this.node = null;
            this.content = null;
            this.defineBinding("content", {"<->": "node.content"});
            this.defineBinding("expanded", {"<->": "node.expanded"});
            this.defineBinding("parent", {"<-": "node.parent"});
            this.defineBinding("children", {"<-": "node.children"});
        }
    },

    initWithNodeAndDepth: {
        value: function (node, depth) {
            this.depth = depth;
            this.node = node;
            return this;
        }
    }

});

var Node = exports.TreeController = Montage.create(Montage, {

    didCreate: {
        value: function () {

            this.content = null;
            this.parent = null;
            this.expanded = false;
            this.childrenPath = null;
            this.children = [];
            this.childNodes = [];
            this.childIterations = [];
            this.indentedChildIterations = [];
            this.iterations = [];

            // childrenPath -> children
            this.defineBinding("children.rangeContent()", {"<-": "content.path(childrenPath)"});

            // children -> childNodes
            this.children.addRangeChangeListener(this, "children");

            // childNodes + expanded -> length
            this.defineBinding("length", {"<-": "1 + (expanded ? childNodes.sum{length} : 0)"});

            // childNodes -> childIterations
            this.defineBinding("childIterations.rangeContent()", {
                "<-": "expanded ? childNodes.flatten{iterations} : []"
            });

            // childIterations -> indentedChildIterations
            this.childIterations.addRangeChangeListener(this, "childIterations");

            // iteration + indentedChildIterations -> iterations
            this.iteration = Iteration.create().initWithNodeAndDepth(this, 0);
            this.defineBinding("iterations.rangeContent()", {
                "<-": "[[iteration], indentedChildIterations].flatten()"
            });

        }
    },

    init: {
        value: function (content, childrenPath, parent) {
            this.parent = parent || null;
            this.content = content;
            this.childrenPath = childrenPath;
            return this;
        }
    },

    handleChildrenRangeChange: {
        value: function (plus, minus, index) {
            this.childNodes.swap(
                index,
                minus.length,
                plus.map(function (child) {
                    return Node.create().init(
                        child,
                        this.childrenPath,
                        this
                    );
                }, this)
            );
        }
    },

    handleChildIterationsRangeChange: {
        value: function (plus, minus, index) {
            this.indentedChildIterations.swap(
                index,
                minus.length,
                plus.map(function (iteration) {
                    return this.Iteration.create().initWithNodeAndDepth(
                        iteration.node,
                        iteration.depth + 1
                    );
                }, this)
            );
        }
    },

    Iteration: {
        value: Iteration
    }

});

