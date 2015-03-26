/**
 * @module montage/core/range-controller
 */
var Montage = require("./core").Montage;
var GenericCollection = require("collections/generic-collection");
var observableArrayProperties = require("collections/listen/array-changes").observableArrayProperties;

// The content controller is responsible for determining which content from a
// source collection are visible, their order of appearance, and whether they
// are selected. Multiple repetitions may share a single content controller
// and thus their selection state.

// The controller manages a series of visible iterations. Each iteration has a
// corresponding "object" and whether that iteration is "selected". The
// controller uses a bidirectional binding to ensure that the controller's
// "selections" collection and the "selected" property of each iteration are in
// sync.

// The controller can determine which content to display and the order in which
// to render them in a variety of ways. You can either use a "selector" to
// filter and sort the content or use a "visibleIndexes" array. The controller
// binds the content of "organizedContent" depending on which strategy you use.

// The content of "organizedContent" is then reflected with corresponding
// incremental changes to "iterations". The "iterations" array will always
// have an "iteration" corresponding to the "object" in "organizedContent" at
// the same position.

/**
 * @const {Array}
 */
var EMPTY_ARRAY = Object.freeze([]);

/**
 * A `_RangeSelection` is a special kind of `Array` that knows about a `RangeController`
 * and maintains invariants about itself relative to the properties of the
 * `RangeController`. A `_RangeSelection` should only be modified using the `splice`
 * method. Changes by directly using other `Array` methods can break the invariants.
 *
 * @class _RangeSelection
 * @private
 */

var _RangeSelection = function(content, rangeController) {
    var self = content;
    //Moved to RangeSelection.prototype for optimization
    //self.makeObservable();
    self.__proto__ = _RangeSelection.prototype;
    
    self.rangeController = rangeController;
    self.contentEquals = content && content.contentEquals || Object.is;

    //Moved to _RangeSelection.prototype for optimization
    // Object.defineProperty(self, "clone", {
    //     value: function(){
    //         return this.slice();
    //     }
    // });
     // Object.defineProperty(self, "swap", {
     //     configurable: false,
     //     value: _RangeSelection.prototype.swap
     // });
     // Object.defineProperty(self, "push", {
     //     configurable: false,
     //     value: _RangeSelection.prototype.push
     // });
    return self;
};
_RangeSelection.prototype = Object.create(Array.prototype, observableArrayProperties);
Object.defineProperty(_RangeSelection.prototype, "clone", {
    value: function(){
        return this.slice();
    }
});
var oldSwap = self.swap;
Object.defineProperty(_RangeSelection.prototype, "oldSwap", {
    configurable: false,
    value: observableArrayProperties.swap.value
});
Object.defineProperty(_RangeSelection.prototype, "swap", {
    configurable: false,
    value: function(start, howMany, itemsToAdd) {
        return this.swap_or_push(start, howMany, itemsToAdd);
    }
});
_RangeSelection.prototype.oldPush = observableArrayProperties.push.value;
Object.defineProperty(_RangeSelection.prototype, "push", {
    configurable: false,
    value: function() {
          var i = -1,
              l = arguments.length,
              x = Array(l);

          while (++i < l) {
            x[i] = arguments[i];
          }
        
        this.swap_or_push(this.length, 0, x);
    }
});
    
/**
 * A custom version of swap to ensure that changes obey the RangeController
 * invariants:
 *  - if rC.multiSelect is false, only allow one item in set.
 *  - if rC.avoidsEmtySelection is true, require at least one item in set.
 *  - only add items that are present in rC.content
 *  - enforce uniqueness of items according to the contentEquals of the content
 *
 * @function swap
 * @param {number} start
 * @param {number} howMany
 * @param {Object} itemsToAdd
 *
 */
Object.defineProperty(_RangeSelection.prototype, "swap_or_push", {
    configurable: false,
    value: function(start, howMany, itemsToAdd) {
        var content = this.rangeController.content;
        this.contentEquals = content && content.contentEquals || Object.is;
        start = start >= 0 ? start : this.length + start;
        var oldLength = this.length;
        var minusLength = Math.min(howMany, oldLength - start);

		if(itemsToAdd) {

            itemsToAdd.contentEquals = this.contentEquals;

            var plus = itemsToAdd.filter(function(item, index){
                // do not add items to the selection if they aren't in content
                if (content && !content.has(item)) {
                    return false;
                }

                // if the same item appears twice in the add list, only add it once
                if (itemsToAdd.findLast(item) > index) {
                    return false;
                }

                // if the item is already in the selection, don't add it
                // unless it's in the part that we're about to delete.
                var indexInSelection = this.find(item);
                return indexInSelection < 0 ||
                        (indexInSelection >= start && indexInSelection < start + minusLength);

            }, this);
		}
		else {
			plus = EMPTY_ARRAY;
		}


        var minus;
        if (minusLength === 0) {
            // minus will be empty
            minus = EMPTY_ARRAY;
        } else {
            minus = Array.prototype.slice.call(this, start, start + minusLength);
        }
        var diff = plus.length - minus.length;
        var newLength = Math.max(this.length + diff, start + plus.length);
        var args;

        if (!this.rangeController.multiSelect && newLength > 1) {
            // use the last-supplied item as the sole element of the set
            var last = plus.length ? plus[plus.length-1] : this.one();
            if(oldLength === 0) {
                this.oldPush(last);
                return EMPTY_ARRAY;
            }
            else {
                return this.oldSwap(0, oldLength, [last]);
            }
        } else if (this.rangeController.avoidsEmptySelection && newLength === 0) {
            // use the first item in the selection, unless it is no longer in the content
            if (content.has(this[0])) {
                if((this.length-1) === 0) {
                    return EMPTY_ARRAY;
                }
                else {
                    return this.oldSwap(1, this.length-1);
                }
            } else {
                if(this.length === 0) {
                    this.oldPush(content.one());
                    return EMPTY_ARRAY;
                }
                else {
                    return this.oldSwap(0, this.length, [content.one()]);
                }
            }
        } else {
            return this.oldSwap(start, howMany, plus);
        }

    }
});


/**
 * A `RangeController` is responsible for managing "ranged content", typically
 * an array, but any collection that implements ranged content change dispatch,
 * `(plus, minus, index)`, would suffice. The controller manages selection and
 * governs the filtering and ordering of the content. `RangeController` is not
 * affiliated with a number range input.
 *
 * A `RangeController` receives a `content` collection, manages what portition
 * of that content is visible and the order of its appearance
 * (`organizedContent`), and projects changes to the the organized content into
 * an array of iteration controllers (`iterations`, containing instances of
 * `Iteration`).
 *
 * The `RangeController` provides a variety of knobs for how to project the
 * content into the organized content, all of which are optional, and the
 * default behavior is to preserve the content and its order.
 * You can use the bindings path expression language (from FRB) to determine
 * the `sortPath` and `filterPath`.
 * There is a `reversed` flag to invert the order of appearance.
 * The `visibleIndexes` property will pluck values from the sorted and filtered
 * content by position, in arbitrary order.
 * The `start` and `length` properties manage a sliding window into the
 * content.
 *
 * The `RangeController` is also responsible for managing which content is
 * selected and provides a variety of knobs for that purpose.
 *
 * @class RangeController
 * @classdesc Manages the selection and visible portion of given content,
 * typically an Array for for a [Repetition]{@link Repetition}.
 * @extends Montage
 */
var RangeController = exports.RangeController = Montage.specialize( /** @lends RangeController.prototype # */ {
    /**
     * @constructs RangeController
     */
    constructor: {
        value: function RangeController(content) {
            this.content = null;
            this._selection = new _RangeSelection([], this);

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
            // underlying content into organizedContent.
            // The filterPath,
            // sortedPath, reversed, and visibleIndexes are all optional stages
            // in that pipeline and used if non-null and in that order.
            // The _orderedContent variable is a necessary intermediate stage
            // From which visibleIndexes plucks visible values.
            this.organizedContent = [];
            // dispatches handleOrganizedContentRangeChange
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

            this.addRangeAtPathChangeListener("content", this, "handleContentRangeChange");
            this.addPathChangeListener("sortPath", this, "handleOrderChange");
            this.addPathChangeListener("reversed", this, "handleOrderChange");
            this.addOwnPropertyChangeListener("multiSelect", this);

            this.iterations = [];

            if (content) {
                this.initWithContent(content);
            }
        }
    },

    /**
     * Initializes a range controller with a backing collection.
     *
     * @function
     * @param {Array|SortedSet} content - Any collection that produces range change events
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
     * to sort by name.
     * If the `sortPath` is null, the content is not sorted.
     *
     * @property {string} value
     */
    sortPath: {value: null},

    /**
     * Whether to reverse the order of the sorted content.
     *
     * @property {boolean} value
     */
    reversed: {value: null},

    /**
     * An FRB expression that determines how to filter content like
     * "name.startsWith('A')" to see only names starting with 'A'.
     * If the `filterPath` is null, all content is accepted.
     *
     * @property {string} value
     */
    filterPath: {value: null},

    /**
     * An array of indexes to pluck from the ordered and filtered content.
     * The output will be an array of the corresponding content.
     * If the `visibleIndexes` is null, all content is accepted.
     *
     * @property {Array.<number>}
     */
    visibleIndexes: {value: null},

    /**
     * The first index of a sliding window over the content, suitable for
     * binding (indirectly) to the scroll offset of a large list.
     * If `start` or `length` is null, all content is
     * accepted.
     *
     * @property {Number}
     */
    start: {value: null},

    /**
     * The length of a sliding window over the content, suitable for binding
     * (indirectly) to the scroll height.
     * If `start` or `length` is null, all content is
     * accepted.
     *
     * @property {Number}
     */
    length: {value: null},


    // Managing Selection
    // ------------------

    /**
     * Whether to select new content automatically.
     * @property {boolean}
     * @default false
     *
     * @todo make this work
     */
    selectAddedContent: {value: false},

    /**
     * Whether to automatically deselect content that disappears from the
     * `organizedContent`.
     *
     * @default false
     * @property {boolean}
     */
    deselectInvisibleContent: {value: false},

    /**
     * Whether to automatically clear the selection whenever the
     * `sortPath`, `filterPath`, or `reversed`
     * knobs change.
     *
     * @default false
     * @property {boolean}
     */
    clearSelectionOnOrderChange: {value: false},

    /**
     * Whether to automatically reselect a value if it is the last value
     * removed from the selection.
     *
     * @default false
     * @property {boolean}
     */
    avoidsEmptySelection: {value: false},

    /**
     * Whether to automatically deselect all previously selected content when a
     * new selection is made.
     *
     * @default false
     * @property {boolean}
     */
    multiSelect: {value: false},


    // Properties managed by the controller
    // ------------------------------------

    /**
     * The content after it has been sorted, reversed, and filtered, suitable
     * for plucking visible indexes and/or then the sliding window.
     *
     * @private
     */
    _orderedContent: {value: null},

    /**
     * An array incrementally projected from `content` through sort,
     * reversed, filter, visibleIndexes, start, and length.
     *
     * @property {Array.<Object>}
     */
    organizedContent: {value: null},

    /**
     * An array of iterations corresponding to each of the values in
     * `organizedContent`, providing an interface for getting or
     * setting whether each is selected.
     *
     * @property {Array.<Iteration>}
     */
    iterations: {value: null},

    _selection: {value: null},

    /**
     * A subset of the `content` that are selected.
     * The user may safely reassign this property and all iterations will react
     * to the change.
     * The selection may be `null`.
     * The selection may be any collection that supports range change events
     * like `Array` or `SortedSet`.
     *
     * @param {Collection} a collection of values to be set as the selection.
     * @returns {?Array|Set|SortedSet}
     *
     * @deprecated: setting the `selection` will not replace it with the provided.
     * collection. Instead, it will empty the selection and then shallow-copy the
     * contents of the argument into the existing selection array. This is done to
     * maintain the complicated invariants about what the selection can be.
     */
    selection: {
        get: function () {
            return this._selection;
        },
        set: function (collection) {
            var args = [0, this._selection.length];
            if (collection && collection.toArray) {
                args = args.concat(collection.toArray());
            }
            this._selection.splice.apply(this._selection, args);
        }
    },

    /**
     * A managed interface for adding values to the selection, accounting for
     * `multiSelect`.
     * You can however directly manipulate the selection, but that will update
     * the selection asynchronously because the controller cannot change the
     * selection while handling a selection change event.
     *
     * @function
     * @param value
     */
    select: {
        value: function (value) {
            if (!this.multiSelect && this.selection.length >= 1) {
                this.selection.clear();
            }
            this.selection.add(value);
        }
    },

    /**
     * A managed interface for removing values from the selection, accounting
     * for `avoidsEmptySelection`.
     * You can however directly manipulate the selection, but that will update
     * the selection asynchronously because the controller cannot change the
     * selection while handling a selection change event.
     *
     * @function
     * @param value
     */
    deselect: {
        value: function (value) {
            if (!this.avoidsEmptySelection || this.selection.length > 1) {
                this.selection["delete"](value);
            }
        }
    },

    /**
     * A managed interface for clearing the selection, accounting for
     * `avoidsEmptySelection`.
     * You can however directly manipulate the selection, but that will update
     * the selection asynchronously because the controller cannot change the
     * selection while handling a selection change event.
     *
     * @function
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
     * `selectAddedContent`.
     *
     * @function
     * @param value
     * @returns {boolean} whether the value was added
     */
    add: {
        value: function (value) {
            var result;

            if (!this.content) {
                this.content = [];
            }
            result = this.content.add(value);
            if (result) {
                this.handleAdd(value);
            }
            return result;
        }
    },

    /**
     * Proxies pushing content to the underlying collection, accounting for
     * `selectAddedContent`.
     *
     * @function
     * @param ...values
     * @returns {boolean} whether the value was added
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
     *
     * @function
     * @returns the popped value
     */
    pop: {
        value: function () {
            return this.content.pop();
        }
    },

    /**
     * Proxies shifting content from the underlying collection.
     *
     * @function
     * @returns the shifted value
     */
    shift: {
        value: function () {
            return this.content.shift();
        }
    },

    /**
     * Proxies unshifting content to the underlying collection, accounting for
     * `selectAddedContent`.
     *
     * @function
     * @param ...values
     * @returns {boolean} whether the value was added
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
     * Proxies splicing values into the underlying collection.
     * Accounts for * `selectAddedContent`.
     *
     * @function
     * @returns the resulting content
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
     * Proxies swapping values in the underlying collection.
     * Accounts for * `selectAddedContent`
     *
     * @function
     * @param {number} index the position at which to remove values
     * @param {number} minusLength the number of values to remove
     * @param {Array} plus the values to add
     * @returns {Array} `minus`, the removed values from the content
     */
    swap: {
        value: function (index, length, values) {
            var result = this.content.swap.apply(this.content, arguments);
            if (values) {
                for (var index = 2; index < values.length; index++) {
                    this.handleAdd(values[index]);
                }
            }
            return result;
        }
    },

    /**
     * Proxies deleting content from the underlying collection.
     *
     * @function
     * @param value
     * @returns {boolean} whether the value was found and deleted successfully
     */
    "delete": {
        value: function (value) {
            return this.content["delete"](value);
        }
    },

    /**
     * Does the value exist in the content?
     *
     * @function
     * @param {object} value the value to test for
     * @returns {boolean}
     */
    has: {
        value: function (value) {
            if (this.content) {
                return this.content.has(value);
            } else {
                return false;
            }
        }
    },

    /**
     * Proxies adding each value into the underlying collection.
     *
     * @function
     * @param {...object} values
     */
    addEach: {
        value: GenericCollection.prototype.addEach
    },

    /**
     * Proxies deleting each value out from the underlying collection.
     * @function
     * @param {...object} values
     */
    deleteEach: {
        value: GenericCollection.prototype.deleteEach
    },

    /**
     * Proxies clearing the underlying content collection.
     * @function
     */
    clear: {
        value: function () {
            this.content.clear();
        }
    },

    /**
     * Creates content and adds it to the controller and its backing
     * collection.
     * Uses `add` and `contentConstructor`.
     * @function
     * @returns the value constructed and added
     */
    addContent: {
        value: function () {
            var content = new this.contentConstructor();
            this.add(content);
            return content;
        }
    },

    /**
     * @private
     */
    _contentConstructor: {
        value: null
    },

    /**
     * Creates a content value for this range controller.
     * If the backing
     * collection has an intrinsict type, uses its `contentConstructor`.
     * Otherwise, creates and returns simple, empty objects.
     *
     * This property can be set to an alternate content constructor, which will
     * take precedence over either of the above defaults.
     *
     * @type {function}
     */
    contentConstructor: {
        get: function () {
            if (this._contentConstructor) {
                return this._contentConstructor;
            } else if (this.content && this.content.contentConstructor) {
                return this.content.contentConstructor;
            } else {
                return Object;
            }
        },
        set: function (contentConstructor) {
            this._contentConstructor = contentConstructor;
        }
    },

    /**
     * Dispatched by range changes to the controller's content, arranged in
     * constructor.
     * Reacts to content changes to ensure that content that no
     * longer exists is removed from the selection, regardless of whether it is
     * from the user or any other entity modifying the backing collection.
     * @private
     */
    handleContentRangeChange: {
        value: function (plus, minus, index) {
            if (this.selection.length > 0) {
                var equals = this.content && this.content.contentEquals || Object.is;
                // remove all values from the selection that were removed (but
                // not added back)
                minus.deleteEach(plus, equals);
                if (this.selection) {
                    this.selection.deleteEach(minus);
                }
            }
        }
    },

    /**
     * Watches changes to the private reflection of the public selection,
     * enforcing the `multiSelect` and `avoidsEmptySelection` invariants.
     * @private
     */
    handleSelectionRangeChange : {
        value: function (plus, minus, index) {
            if (this.selection) {
                if (this.content) {
                    var notInContent = [];
                    for (var i=0;i<plus.length;i++) {
                        if (!this.content.has(plus[i])) {
                            notInContent.push(plus[i]);
                        }
                    }
                    this._selection.deleteEach(notInContent);
                    if (!this.multiSelect && this._selection.length > 1) {
                        var last = this._selection.pop();
                        this._selection.clear();
                        this._selection.add(last);
                    }
                    if (this.avoidsEmptySelection && this._selection.length == 0) {
                        this._selection.add(minus[0]);
                    }
                } else {
                    this._selection.clear();
                }
            }
        }
    },

    /**
     * Dispatched by a range-at-path change listener arranged in constructor.
     * Synchronizes the `iterations` with changes to `organizedContent`.
     * Also manages the `deselectInvisibleContent` invariant.
     * @private
     */
    handleOrganizedContentRangeChange: {
        value: function (plus, minus, index) {
            if (this.deselectInvisibleContent && this.selection) {
                var diff = minus.clone(1);
                diff.deleteEach(plus);
                this.selection.deleteEach(minus);
            }
        }
    },

    /**
     * Dispatched by changes to sortPath, filterPath, and reversed to maintain
     * the `clearSelectionOnOrderChange` invariant.
     * @private
     */
    handleOrderChange: {
        value: function () {
            if (this.clearSelectionOnOrderChange && this.selection) {
                this.selection.clear();
            }
        }
    },

    /**
     * Dispatched manually by all of the managed methods for adding values to
     * the underlying content, like `add` and `push`, to support `multiSelect`.
     * @private
     */
    handleAdd: {
        value: function (value) {
            if (this.selectAddedContent && this.selection) {
                if (
                    !this.multiSelect &&
                    this.selection.length >= 1
                ) {
                    this.selection.clear();
                }
                this.selection.add(value);
            }
        }
    },

    /**
     * Enforces the `multiSelect` invariant when that property becomes true.
     * @private
     */
    handleMultiSelectChange: {
        value: function () {
            if (this.selection) {
                var length = this.selection.length;
                if (!this.multiSelect && length > 1) {
                    var last = this._selection.pop();
                    this._selection.clear();
                    this._selection.add(last);
                }
            }
        }
    }

}, /** @lends RangeController */ {

    blueprintModuleId:require("./core")._blueprintModuleIdDescriptor,

    blueprint:require("./core")._blueprintDescriptor

});

// TODO @kriskowal scrollIndex, scrollDelegate -> scrollDelegate.scrollBy(offset)

// TODO multiSelectWithModifiers to support ctrl/command/shift selection such
// that individual values and ranges of values.

// TODO @kriskowal decouple such that content controllers can be chained using
// adapter pattern

