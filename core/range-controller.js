"use strict";

var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;
var GenericCollection = require("collections/generic-collection");

// The content controller is responsible for determining which content from a
// source collection are visible, their order of appearance, and whether they
// are selected.  Multiple repetitions may share a single content controller
// and thus their selection state.

// The controller manages a series of visible iterations.  Each iteration has a
// corresponding "object" and whether that iteration is "selected".  The
// controller uses a bidirectional binding to ensure that the controller's
// "selections" collection and the "selected" property of each iteration are in
// sync.

/**
 * A <code>RangeController.Iteration</code> is one of the iterations from a
 * <code>RangeController</code> corresponding to a single, visible entry from
 * its content.  The only service of an iteration controller is a bidirectional
 * binding for whether the iteration is selected or not.
 */
var RangeControllerIteration = exports.RangeControllerIteration = Montage.create(Montage, {

    /**
     * @private
     */
    didCreate: {
        value: function () {
            this.object = null;
            this.controller = null;
            this.defineBinding("selected", {"<->": "controller.selection.has(object)"});
            // TODO remove this migration shim
            this.defineBinding("content", {"<->": "object"});
        }
    },

    /**
     * The <code>RangeController</code> uses this method to associate an
     * iteration with its owner and corresponding content.
     * @param content A value to associate this iteration with from one of  the
     * range controller's content.
     * @param controller The corresponding range controller
     */
    initWithContentAndController: {
        value: function (content, controller) {
            this.content = content;
            this.controller = controller;
            return this;
        }
    },

    /**
     * The associated content for this iteration.
     * @deprecated Use <code>content</code>
     */
    // TODO remove this deprecated property
    object: {value: null},

    /**
     * The associated content for this iteration.
     */
    content: {value: null},

    /**
     * The range controller that owns this iteration.
     */
    controller: {value: null},

    /**
     * Whether the content at this iteration is selected.  This is
     * bidirectionally bound, so changes to the range controller's selection
     * will automatically update this property, and changes to this property
     * will automatically add or remove the corresponding content to or from
     * the range controller's selection.
     */
    selected: {value: null}

});

// The controller can determine which content to display and the order in which
// to render them in a variety of ways.  You can either use a "selector" to
// filter and sort the content or use a "visibleIndexes" array.  The controller
// binds the content of "organizedContent" depending on which strategy you use.
//
// The content of "organizedContent" is then reflected with corresponding
// incremental changes to "iterations".  The "iterations" array will always
// have an "iteration" corresponding to the "object" in "organizedContent" at
// the same position.

/**
 * A <code>RangeController</code> receives a <code>content</code> collection,
 * manages what portition of that content is visible and the order of its
 * appearance (<code>organizedContent</code>), and projects changes to the the
 * organized content into an array of iteration controllers
 * (<code>iterations</code>, containing instances of <code>Iteration</code>).
 *
 * The <code>RangeController</code> provides a variety of knobs for how to
 * project the content into the organized content, all of which are optional,
 * and the default behavior is to preserve the content and its order.  You can
 * use the bindings path expression language (from FRB) to determine the
 * <code>sortPath</code> and <code>filterPath</code>.  There is a
 * <code>reversed</code> flag to invert the order of appearance.  The
 * <code>visibleIndexes</code> property will pluck values from the sorted and
 * filtered content by position, in arbitrary order.  The <code>start</code>
 * and <code>length</code> properties manage a sliding window into the content.
 *
 * The <code>RangeController</code> is also responsible for managing which
 * content is selected and provides a variety of knobs for that purpose.
 */
var RangeController = exports.RangeController = Montage.create(Montage, {

    /**
     * @private
     */
    didCreate: {
        value: function () {

            this.content = null;
            this.selection = [];

            this.sortPath = null;
            this.filterPath = null;
            this.visibleIndexes = null;
            this.reversed = false;
            this.start = null;
            this.length = null;

            this.selectAddedContent = false;
            this.deselectInvisibleContent = false;
            this.clearSelectionOnOrderChange = false;
            this.avoidsEmptySelection = false;
            this.multiSelect = false;

            // The following establishes a pipeline for projecting the
            // underlying content into organizedContent.  The filterPath,
            // sortedPath, reversed, and visibleIndexes are all optional stages
            // in that pipeline and used if non-null and in that order.
            // The _orderedContent variable is a necessary intermediate stage
            // From which visibleIndexes plucks visible values.
            this.organizedContent = [];
            this.organizedContent.addRangeChangeListener(this, "organizedContent");
            this.defineBinding("_orderedContent", {
                "<-": "content" +
                    ".($filterPath.defined() ? filter{path($filterPath)} : ())" +
                    ".($sortPath.defined() ? sorted{path($sortPath)} : ())" +
                    ".($reversed ?? 0 ? reversed() : ())"
            });
            this.defineBinding("organizedContent.rangeContent()", {
                "<-": "_orderedContent.(" +
                    "$visibleIndexes.defined() ?" +
                    "$visibleIndexes" +
                        ".filter{<$_orderedContent.length}" +
                        ".map{$_orderedContent[()]}" +
                    " : ()" +
                ").(" +
                    "$start.defined() && $length.defined() ?" +
                    "view($start, $length)" +
                    " : ()" +
                ")"
            });

            this.addRangeAtPathChangeListener("selection", this, "handleSelectionRangeChange");
            this.addRangeAtPathChangeListener("content", this, "handleContentRangeChange");
            this.addPathChangeListener("sortPath", this, "handleOrderChange");
            this.addPathChangeListener("reversed", this, "handleOrderChange");

            this.iterations = [];

        }
    },

    /**
     * Initializes a range controller with a backing collection.
     * @param content Any collection that produces range change events, like an
     * <code>Array</code> or <code>SortedSet</code>.
     * @returns this
     */
    initWithContent: {
        value: function (content) {
            this.content = content;
            return this;
        }
    },

    // Organizing Content
    // ------------------

    /**
     * An FRB expression that determines how to sort the content, like "name"
     * to sort by name.  If the <code>sortPath</code> is null, the content
     * is not sorted.
     */
    sortPath: {value: null},

    /**
     * Whether to reverse the order of the sorted content.
     */
    reversed: {value: null},

    /**
     * An FRB expression that determines how to filter content like
     * "name.startsWith('A')" to see only names starting with 'A'.  If the
     * <code>filterPath</code> is null, all content is accepted.
     */
    filterPath: {value: null},

    /**
     * An array of indexes to pluck from the ordered and filtered content.  The
     * output will be an array of the corresponding content.  If the
     * <code>visibleIndexes</code> is null, all content is accepted.
     */
    visibleIndexes: {value: null},

    /**
     * The first index of a sliding window over the content, suitable for
     * binding (indirectly) to the scroll offset of a large list.
     * If <code>start</code> or <code>length</code> is null, all content is
     * accepted.
     */
    start: {value: null},

    /**
     * The length of a sliding window over the content, suitable for binding
     * (indirectly) to the scroll height.
     * If <code>start</code> or <code>length</code> is null, all content is
     * accepted.
     */
    length: {value: null},


    // Managing Selection
    // ------------------

    /**
     * Whether to select new content automatically.
     *
     * Off by default.
     */
    selectAddedContent: {value: false},

    /**
     * Whether to automatically deselect content that disappears from the
     * <code>organizedContent</code>.
     *
     * Off by default.
     */
    deselectInvisibleContent: {value: false},

    /**
     * Whether to automatically clear the selection whenever the
     * <code>sortPath</code>, <code>filterPath</code>, or <code>reversed</code>
     * knobs change.
     *
     * Off by default.
     */
    clearSelectionOnOrderChange: {value: false},

    /**
     * Whether to automatically reselect a value if it is the last value
     * removed from the selection.
     *
     * Off by default.
     */
    avoidsEmptySelection: {value: false},

    /**
     * Whether to automatically deselect all previously selected content when a
     * new selection is made.
     *
     * Off by default.
     */
    multiSelect: {value: false},


    // Properties managed by the controller
    // ------------------------------------

    /**
     * The content after it has been sorted, reversed, and filtered, suitable
     * for plucking visible indexes and/or then the sliding window.
     * @private
     */
    _orderedContent: {value: null},

    /**
     * An array incrementally projected from <code>content</code> through sort,
     * reversed, filter, visibleIndexes, start, and length.
     */
    organizedContent: {value: null},

    /**
     * An array of iterations corresponding to each of the values in
     * <code>organizedContent</code>, providing an interface for getting or
     * setting whether each is selected.
     */
    iterations: {value: null},

    /**
     * A subset of the <code>content</code> that are selected.  The user may
     * safely reassign this property and all iterations will react to the
     * change.  The selection may be <code>null</code>.  The selection may be
     * any collection that supports range change events like <code>Array</code>
     * or <code>SortedSet</code>.
     */
    selection: {value: null},

    /**
     * A managed interface for adding values to the selection, accounting for
     * <code>multiSelect</code>.
     * You can however directly manipulate the selection, but that will update
     * the selection asynchronously because the controller cannot change the
     * selection while handling a selection change event.
     */
    select: {
        value: function (value) {
            if (!this.multiSelect && this.selection.length >= 1) {
                this.selection.clear();
            }
            this.selection.add(value);
        }
    },

    /*
     * A managed interface for removing values from the selection, accounting
     * for <code>avoidsEmptySelection</code>.
     * You can however directly manipulate the selection, but that will update
     * the selection asynchronously because the controller cannot change the
     * selection while handling a selection change event.
     */
    deselect: {
        value: function (value) {
            if (!this.avoidsEmptySelection || this.selection.length > 1) {
                this.selection["delete"](value);
            }
        }
    },

    /*
     * A managed interface for clearing the selection, accounting for
     * <code>avoidsEmptySelection</code>.
     * You can however directly manipulate the selection, but that will update
     * the selection asynchronously because the controller cannot change the
     * selection while handling a selection change event.
     */
    clearSelection: {
        value: function () {
            if (!this.avoidsEmptySelection || this.selection.length > 1) {
                this.selection.clear();
            }
        }
    },

    /**
     * Proxies adding content to the underlying collection, accounting for
     * <code>selectAddedContent</code>.
     * @param value
     * @returns whether the value was added
     */
    add: {
        value: function (value) {
            var result = this.content.add(value);
            if (result) {
                this.handleAdd(value);
            }
            return result;
        }
    },

    /**
     * Proxies pushing content to the underlying collection, accounting for
     * <code>selectAddedContent</code>.
     * @param ...values
     * @returns whether the value was added
     */
    push: {
        value: function () {
            var result = this.content.push.apply(this.content, arguments);
            for (var index = 0; index < arguments.length; index++) {
                this.handleAdd(arguments[index]);
            }
            return result;
        }
    },

    /**
     * Proxies popping content from the underlying collection.
     * @returns the popped values
     */
    pop: {
        value: function () {
            return this.content.pop();
        }
    },

    /**
     * Proxies shifting content from the underlying collection.
     * @returns the shifted values
     */
    shift: {
        value: function () {
            return this.content.shift();
        }
    },

    /**
     * Proxies unshifting content to the underlying collection, accounting for
     * <code>selectAddedContent</code>.
     * @param ...values
     * @returns whether the value was added
     */
    unshift: {
        value: function () {
            var result = this.content.unshift.apply(this.content, arguments);
            for (var index = 0; index < arguments.length; index++) {
                this.handleAdd(arguments[index]);
            }
            return result;
        }
    },

    /**
     * Proxies splicing values into the underlying collection.  Accounts for
     * <code>selectAddedContent</code>
     */
    splice: {
        value: function () {
            var result = this.content.splice.apply(this.content, arguments);
            for (var index = 2; index < arguments.length; index++) {
                this.handleAdd(arguments[index]);
            }
            return result;
        }
    },

    /**
     * Proxies swapping values in the underlying collection.  Accounts for
     * <code>selectAddedContent</code>
     */
    swap: {
        value: function (index, length, values) {
            var result = this.content.splice.apply(this.content, values);
            for (var index = 2; index < values.length; index++) {
                this.handleAdd(values[index]);
            }
            return result;
        }
    },

    /**
     * Proxies deleting content from the underlying collection.
     */
    "delete": {
        value: function (value) {
            return this.content["delete"](value);
        }
    },

    /**
     * Proxies adding each value into the underlying collection.
     */
    addEach: {
        value: GenericCollection.prototype.addEach
    },

    /**
     * Proxies deleting each value out from the underlying collection.
     */
    deleteEach: {
        value: GenericCollection.prototype.deleteEach
    },

    /**
     * Proxies clearing the underlying content collection.
     */
    clear: {
        value: function () {
            this.content.clear();
        }
    },

    /**
     * Dispatched by range changes to the controller's content, arranged in
     * didCreate.  Reacts to content changes to ensure that content that no
     * longer exists is removed from the selection, regardless of whether it is
     * from the user or any other entity modifying the backing collection.
     * @private
     */
    handleContentRangeChange: {
        value: function (plus, minus, index) {
            if (this.selection) {
                // remove all values from the selection that were removed (but
                // not added back)
                minus.deleteEach(plus);
                this.selection.deleteEach(minus);
            }
        }
    },

    /**
     * Dispatched by a range-at-path change listener on the selection, arragned
     * in didCreate.  Reacts to managed (as by the select or deselect methods)
     * or unmanaged changes to the selection by enforcing the
     * <code>avoidsEmptySelection</code> and
     * <code>multiSelect</code> invariants.  However, it must
     * schedule these changes for a separate event because it cannot interfere
     * with the change operation in progress.
     * @private
     */
    handleSelectionRangeChange: {
        value: function (plus, minus, index) {
            var self = this;
            if (this.selection) {
                Promise.nextTick(function () {
                    var length = self.selection.length;
                    // Performing these in next tick avoids interfering with the
                    // plan in the dispatcher, highlighting the fact that there is
                    // a plan interference hazard inherent to the present
                    // implementation of collection event dispatch.
                    if (self.avoidsEmptySelection && length === 0) {
                        self.select(minus.one());
                    } else if (!self.multiSelect && length > 1) {
                        self.selection.clear();
                        self.select(plus.one());
                    }
                });
            }
        }
    },

    /**
     * Dispatched by a range-at-path change listener arranged in didCreate.
     * Synchronizes the <code>iterations</code> with changes to
     * <code>organizedContent</code>.  Also manages the
     * <code>deselectInvisibleContent</code> invariant.
     * @private
     */
    handleOrganizedContentRangeChange: {
        value: function (plus, minus, index) {
            if (this.deselectInvisibleContent && this.selection) {
                var diff = minus.clone(1);
                diff.deleteEach(plus);
                this.selection.deleteEach(minus);
            }
            this.iterations.swap(index, minus.length, plus.map(function (object) {
                return this.Iteration.create().initWithContentAndController(object, this);
            }, this));
        }
    },

    /**
     * Dispatched by changes to sortPath, filterPath, and reversed to maintain
     * the <code>clearSelectionOnOrderChange</code> invariant.
     * @private
     */
    handleOrderChange: {
        value: function () {
            if (this.selection && this.clearSelectionOnOrderChange) {
                this.selection.clear();
            }
        }
    },

    /**
     * Dispatched manually by all of the managed methods for adding values to
     * the underlying content, like <code>add</code> and <code>push</code>, to
     * support <code>multiSelect</code>.
     * @private
     */
    handleAdd: {
        value: function (value) {
            if (this.selection) {
                if (this.selectAddedContent) {
                    if (
                        !this.multiSelect &&
                        this.selection.length >= 1
                    ) {
                        this.selection.clear();
                    }
                    this.selection.add(value);
                }
            }
        }
    },

    /**
     * The <code>RangeControllerIteration</code>, overridable by inheritors.
     */
    Iteration: {
        value: RangeControllerIteration
    }

});

// TODO @kriskowal scrollIndex, scrollDelegate -> scrollDelegate.scrollBy(offset)

// TODO multiSelectWithModifiers to support ctrl/command/shift selection such
// that individual values and ranges of values.

