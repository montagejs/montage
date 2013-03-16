"use strict";

var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Template = require("core/template").Template;
var RangeController = require("core/range-controller").RangeController;
var Promise = require("core/promise").Promise;

var Map = require("collections/map");
var Set = require("collections/set");

var Observers = require("frb/observers");
var observeProperty = Observers.observeProperty;
var observeKey = Observers.observeKey;

/**
 * A reusable view-model for each iteration of a repetition.  Each iteration
 * corresponds to a value from the contentController.  When an iteration is
 * drawn, it is tied to the corresponding controller-model that carries which
 * object the iteration is coupled to, and whether it is selected.
 */
var Iteration = exports.Iteration = Montage.create(Montage, {

    /**
     * The parent repetition component.
     */
    repetition: {value: null},

    /**
     * The repetition gets iterations from its <code>contentController</code>.
     * The controller is responsible for tracking which iterations are drawn
     * and which are selected.  The iteration view-model is attached to the
     * controller view-model by this property. The <code>selected</code> and
     * <code>object</code> properties are bound to the eponymous properties of
     * the iteration controller.
     */
    controller: {value: null},

    /**
     * The corresponding content for this iteration.
     */
    object: {value: null},

    /**
     * Whether the content for this iteration is selected.  This property is
     * bound bidirectionally to whether every element on the document for the
     * corresponding drawn iteration has the <code>selected</code> CSS class
     * (synchronized on draw), and whether the <code>object</code> is in the
     * <code>contentController.selection</code> collection.
     */
    selected: {value: null},

    /**
     * A <code>DocumentFragment</code>, donated by the repetition's
     * <code>_iterationTemplate</code> n&eacute;e <code>innerTemplate</code>
     * which contains the elements that the iteration owns when they are not on
     * the document between the top and bottom boundaries.
     * @private
     */
    _fragment: {value: null},

    /**
     * @private
     */
    _childComponents: {value: null},

    /**
     * The position of this iteration within the content controller, and within
     * the document immediately after the repetition has drawn.
     */
    index: {value: null},

    /**
     * The position of this iteration on the document last time it was drawn,
     * and its position within the <code>repetition.drawnIterations</code>.
     * @private
     */
    _drawnIndex: {value: null},

    /**
     * Whether this iteration should be highlighted.  It might be highlighted
     * because the user is touching it, or because it is under some other user
     * cursor as in an autocomplete popdown where the arrow keys manipulate the
     * active iteration.
     */
    active: {value: null},

    /**
     * Whether this iteration appears first in the visible order of iterations.
     */
    isFirst: {value: null},

    /**
     * Whether this iteration appears last in the visible order of iterations.
     */
    isLast: {value: null},

    /**
     * Whether this iteration appears on the 0th position within the iteration,
     * or every other position thereafter.
     */
    isEven: {value: null},

    /**
     * Whether this iteration appears on the 1st position within the iteration,
     * or every other position thereafter.
     */
    isOdd: {value: null},

    /**
     * A flag that indicates that the "no-transition" CSS class should be added
     * to every element in the iteration in the next draw, and promptly removed
     * the draw thereafter.
     * @private
     */
    _noTransition: {value: null},

    /**
     * Creates the initial values of all instance state.
     * @private
     */
    didCreate: {
        value: function () {
            Object.getPrototypeOf(Iteration).didCreate.call(this);
            this.repetition = null;
            this.controller = null;
            this.content = null;
            this.defineBinding("object", {"<->": "content"}); // TODO remove this migration shim
            // The iteration watches whether it is selected.  If the iteration
            // is drawn, it enqueue's selection change draw operations and
            // notifies the repetition it needs to be redrawn.
            // Dispatches handlePropertyChange with the "selected" key:
            this.defineBinding("selected", {
                "<->": "repetition.contentController._selection.has(content)"
            });
            // An iteration can be "on" or "off" the document.  When the
            // iteration is added to a document, the "fragment" is depopulated
            // and placed between "topBoundary" and "bottomBoundary" on the
            // DOM.  The repetition manages the boundary markers around each
            // drawn index.
            this._fragment = null;
            // The corresponding "content" is tracked in
            // repetition._contentForIteration instead of on the iteration
            // itself.  The bindings in the iteration template react to changes
            // in that map.
            this._childComponents = null;
            // The position that this iteration occupies in the controller.
            // This is updated synchronously in response to changes to
            // repetition.iterations, which are in turn synchronized with
            // controller.iterations.  The drawnIndex tracks the index by the
            // end of the next Repetition.draw.
            this.index = null;
            // The position that this iteration occupies in the repetition.
            // This is updated whenever views are added or removed before it in
            // the sequence, an operation of linear complexity but which is not
            // onerous since there should be a managable, fixed-maximum number
            // of drawn iterations.
            this._drawnIndex = null;

            // Describes whether a user gesture is touching this iteration.
            this.active = false;
            // Changes to whether a user is touching the iteration are
            // reflected by the "active" CSS class on each element in the
            // iteration.  This gets updated in the draw cycle, in response to
            // operations that handlePropertyChange adds to the repetition draw
            // cycle.
            // Dispatches handlePropertyChange with the "active" key:
            this.defineBinding("active", {"<->": "repetition.activeIterations.has(())"});

            this.defineBinding("isFirst", {"<-": "index == 0"});
            this.defineBinding("isLast", {"<-": "index == repetition.iterations.length - 1"});
            this.defineBinding("isEven", {"<-": "index % 2 == 0"});
            this.defineBinding("isOdd", {"<-": "index % 2 != 0"});

            this._noTransition = false;

            // dispatch handlePropertyChange:
            this.addOwnPropertyChangeListener("active", this);
            this.addOwnPropertyChangeListener("selected", this);
            this.addOwnPropertyChangeListener("_noTransition", this);

            this.cachedFirstElement = null;

        }
    },

    /**
     * Associates the iteration instance with a repetition.
     */
    initWithRepetition: {
        value: function (repetition) {
            this.repetition = repetition;
            return this;
        }
    },

    /**
     * Disassociates an iteration with its content and prepares it to be
     * recycled on the repetition's list of free iterations.  This function is
     * called by handleOrganizedContentRangeChange when it recycles an
     * iteration.
     */
    recycle: {
        value: function () {
            this.index = null;
            this.content = null;
            // Adding the "no-transition" class ensures that the iteration will
            // stop any transitions applied when the iteration was bound to
            // other content.  It has the side-effect of scheduling a draw, and
            // in that draw scheduling another draw to remove the
            // "no-transition" class.
            this._noTransition = true;
        }
    },

    /**
     * Injects this iteration to the document between its top and bottom
     * boundaries.
     * @param {Number} index The drawn index at which to place the iteration.
     */
    injectIntoDocument: {
        value: function (index) {
            var self = this;
            var repetition = this.repetition;
            var element = repetition.element;
            var boundaries = repetition._boundaries;

            // Add a new top boundary before the next iteration
            var topBoundary = element.ownerDocument.createTextNode("");
            var bottomBoundary = boundaries[index]; // previous
            boundaries.splice(index, 0, topBoundary);
            element.insertBefore(topBoundary, bottomBoundary);

            // Inject the elements into the document
            element.insertBefore(this._fragment, bottomBoundary);

            // Inject the child components onto the repetition
            repetition.childComponents.swap(
                index * repetition._childComponentsPerIteration,
                0,
                this._childComponents
            );

            // Once the child components have drawn once, and thus created all
            // their elements, we can add them to the _iterationForElement map
            var childComponentsLeftToDraw = this._childComponents.length;

            var firstDraw = function (event) {
                event.target.removeEventListener("firstDraw", firstDraw, false);
                childComponentsLeftToDraw--;
                if (!childComponentsLeftToDraw) {
                    self.forEachElement(function (element) {
                        repetition._iterationForElement.set(element, self);
                    });
                }
            };

            // notify the components to wake up and smell the document
            for (var i = 0; i < this._childComponents.length; i++) {
                var childComponent = this._childComponents[i];
                childComponent.addEventListener("firstDraw", firstDraw, false);
                childComponent.needsDraw = true;
            }

            this._drawnIndex = index;
            repetition._drawnIterations.splice(index, 0, this);
            repetition._updateDrawnIndexes(index);
            repetition._dirtyClassListIterations.add(this);
        }
    },

    /**
     * Retracts an iteration from the document, scooping its child nodes into
     * its DOMFragment.
     */
    retractFromDocument: {
        value: function () {
            var index = this._drawnIndex;
            var repetition = this.repetition;
            var element = repetition.element;
            var topBoundary = repetition._boundaries[index];
            var bottomBoundary = repetition._boundaries[index + 1];

            // Remove the elements between the boundaries.  Also remove the top
            // boundary and adjust the boundaries array accordingly so future
            // injections and retractions can find their corresponding
            // boundaries.
            repetition._boundaries.splice(index, 1);
            var fragment = this._fragment;
            var child = topBoundary.nextSibling;
            while (child != bottomBoundary) {
                var next = child.nextSibling;
                element.removeChild(child);
                fragment.appendChild(child);
                child = next;
            }
            element.removeChild(topBoundary);

            this._drawnIndex = null;
            repetition._drawnIterations.splice(index, 1);
            repetition._updateDrawnIndexes(index);
        }
    },

    /**
     * Dispatched by the "active" and "selected" property change listeners to
     * notify the repetition that these iterations need to have their CSS class
     * lists updated.
     * @private
     */
    handlePropertyChange: {
        value: function () {
            if (!this.repetition)
                return;
            this.repetition._dirtyClassListIterations.add(this);
            this.repetition.needsDraw = true;
        }
    },

    /**
     * A utility method for applying changes to every element in this iteration
     * if it is on the document.  This may be safely called on a retracted
     * iteration with no effect.
     * @private
     */
    forEachElement: {
        value: function (callback, thisp) {
            var repetition = this.repetition;
            var index = this._drawnIndex;
            // Short-circuit if the iteration is not on the document.
            if (index == null)
                return;
            for (
                var child = repetition._boundaries[index];
                child !== repetition._boundaries[index + 1];
                child = child.nextSibling
            ) {
                if (child.nodeType === 1) { // tags
                    callback.call(thisp, child);
                }
            }
        }
    },

    // TODO doc
    /**
     */
    firstElement: {
        get: function () {
            var repetition = this.repetition;
            var index = this._drawnIndex;
            if (index == null)
                return;
            for (
                var child = repetition._boundaries[index];
                child !== repetition._boundaries[index + 1];
                child = child.nextSibling
            ) {
                if (child.nodeType === 1) { // tags
                    this.cachedFirstElement = child;
                    return child;
                }
            }
        }
    },

    // TODO doc
    /**
     */
    cachedFirstElement: {
        value: null
    }

});

// Here it is, what we have all been waiting for, the prototype of the hour.
// Give it up for the Repetition...

/**
 * A component that manages copies of its inner template for each value in its
 * content.  The content is managed by a controller.  The repetition will
 * create a <code>RangeController</code> for the content if you provide a
 * <code>content</code> property instead of a <code>contentController</code>.
 *
 * Ensures that the document contains iterations in the same order as provided
 * by the content controller.
 *
 * The repetition strives to avoid moving iterations on, off, or around on the
 * document, prefering to inject or retract iterations between ones that remain
 * in their respective order, or even just rebind existing iterations to
 * alternate content instead of injecting and retracting in the same position.
 */
var Repetition = exports.Repetition = Montage.create(Component, {

    // For the creator:
    // ----

    /**
     * Imperatively initializes a repetition with content.  You can alternately
     * bind the <code>content</code> property of a repetition without
     * initializing.  You should not use the <code>contentController</code>
     * property of the repetition if you are initialize with the
     * <code>content</code> property.
     */
    initWithContent: {
        value: function (content) {
            this.content = content;
            return this;
        }
    },

    /**
     * Imperatively initializes a repetition with a content controller, like a
     * <code>RangeController</code>.  You can alternately bind the
     * <code>contentController</code> property of a repetition without
     * initializing.  You should not use the <code>content</code> property of a
     * repetition if you are using its <code>contentController</code>.
     */
    initWithContentController: {
        value: function (contentController) {
            this.contentController = contentController;
            return this;
        }
    },

    /**
     * A getter and setter for the content of a repetition.  If you set the
     * content property of a repetition, it produces a range content controller
     * for you.  If you get the content property, it will reach into the
     * content controller to give you its content.
     *
     * The content represents the entire backing collection.  The content
     * controller may filter, sort, or otherwise manipulate the visible region
     * of the content.  The <code>index</code> of each iteration corresponds
     * to the position within the visible region of the controller.
     */
    content: {
        get: function () {
            return this.getPath("contentController.content");
        },
        set: function (content) {
            // TODO if we provide an implicit content controller, it should be
            // excluded from a serialization of the repetition.
            this.contentController = RangeController.create().initWithContent(content);
        }
    },

    /**
     * A range controller or instance with the same interface
     * (<code>iterations</code> and <code>selection</code> properties, where
     * each <iteration has <code>object</code> and <code>selected</code>
     * properties).  The controller is responsible for managing which contents
     * are visible, selected, and the order of their appearance.
     */
    contentController: {value: null},

    /**
     * When selection is enabled, each element in an iteration responds to
     * touch and click events such that the iteration is highlighted (with the
     * "active" CSS class) when the user touches or clicks it, and toggles
     * whether the corresponding content is selected.
     *
     * Selection may be enabled and disabled at any time in the life cycle of
     * the repetition.  The repetition watches changes to this property.
     *
     * All repetitions support selection, whether it is used or not.  This
     * property merely dictates whether the repetition handles gestures for
     * selection.
     */
    isSelectionEnabled: {value: null},

    /**
     * A collection of the selected content.  It may be any ranged collection
     * like Array or SortedSet.  The user may get, set, or modify the selection
     * directly.  The selection property is bidirectionally bound to the
     * selection of the content controller.  Every repetition has a content
     * controller, and will use a RangeController if not given one.
     */
    selection: {value: null},

    /**
     * The repetition maintains an array of every visible, selected iteration,
     * in the order of its appearance.  The user should not modify the selected
     * iterations array.
     */
    selectedIterations: {value: null},

    /**
     * The repetition maintains an array of the indexes of every selected
     * iteration.  The user should not modify the array.
     */
    selectedIndexes: {value: null},

    /**
     * The user may determine which iterations are active by setting or
     * manipulating the content of the <code>activeIterations</code> array.  At
     * present, the repetition does not guarantee any particular order of
     * appearnce of the contained iterations.
     */
    activeIterations: {value: null},

    /**
     * The repetition coordinates this array of repetition iterations.  Each
     * iteration tracks its corresponding content, whether it is selected,
     * whether it is active, and what CSS classes are applied on each of its
     * direct child nodes.  This array appears in the order that the iterations
     * will be drawn.  There is one repetition iteration for each controller
     * iteration.  The repetition iterations have more responsibilities than
     * the corresponding controller, but some of the properties are bound by
     * the same names, like <code>object</code> and <code>selected</code>.
     */
    iterations: {value: null},

    /**
     * The user may bind to the <code>currentIteration</code> when the
     * repetition instantiates a new iteration.  The template guarantees that
     * child components can safely bind to the containing repetition.
     *
     * At present, you cannot bind to a grandparent repetition's
     * <code>currentIteration</code>, so it becomes the responsibility of the
     * parent repetition to bind its parent repetition's
     * <code>currentIteration</code> to a property of itself so its children
     * can access their grandparent.
     */
    currentIteration: {value: null},

    /**
     * The user may bind the the <code>currentIteration.object</code> with this
     * shorthand.
     */
    contentAtCurrentIteration: {value: null},


    // For the template:
    // ----

    /**
     * Informs the super-type, <code>Component</code>, that there is no
     * <code>repetition.html</code>.
     * @private
     */
    hasTemplate: {value: false},

    /**
     * A copy of <code>innerTemplate</code>, provided by the
     * <code>Component</code> layer, that produces the HTML and components for
     * each iteration.  If this property is <code>null</code>, it signifies
     * that the template is in transition, either during initialization or due
     * to resetting <code>innerTemplate</code>.  In either case, it is a
     * reliable indicator that the repetition is responding to controller
     * iteration range changes, since that requires a functioning template.
     * @private
     */
    _iterationTemplate: {value: null},

    /**
     * Informs Template that it is not safe to reference the initial DOM
     * contents of the repetition.
     * @see Component.clonesChildComponents
     * @private
     */
    clonesChildComponents: {value: true},


    // Implementation:
    // ----

    /**
     * @private
     */
    didCreate: {
        value: function () {
            Object.getPrototypeOf(Repetition).didCreate.call(this);

            // XXX Note: Any property added to initialize in didCreate must
            // also be accounted for in _teardownIterationTemplate to reset the
            // repetition.

            this.contentController = null;
            this.organizedContent = [];
            this.defineBinding("organizedContent.rangeContent()", {
                "<-": "contentController.organizedContent"
            });
            // Determines whether the repetition listens for mouse and touch
            // events to select iterations, which involves "activating" the
            // iteration when the user touches.
            this.isSelectionEnabled = false;
            this.defineBinding("selection", {
                "<->": "contentController.selection"
            });
            this.defineBinding("selectedIterations", {
                "<-": "iterations.filter{selected}"
            });
            this.defineBinding("selectedIndexes", {
                "<-": "iterations.map{index}"
            });


            // The state of the DOM:
            // ---

            // The template that gets repeated in the DOM
            this._iterationTemplate = null;

            // React to changes to the inner template by setting up a new
            // iteration template and purging all obsolete iterations.
            this.addOwnPropertyChangeListener("innerTemplate", this);

            // The "iterations" array tracks "_controllerIterations"
            // synchronously.  Each iteration corresponds to controlled content
            // at its visible position.  An iteration has an instance of the
            // iteration template / inner template.
            this.iterations = [];
            // The "_drawnIterations" array gets synchronized with
            // "iterations" by applying draw operations when "Repetition.draw"
            // occurs.
            this._drawnIterations = [];
            // Iteration content can be reused.  When an iteration is collected
            // (and when it is initially created), it gets put in the
            // _freeIterations list.
            this._freeIterations = []; // push/pop LIFO
            // Whenever an iteration template is instantiated, it may have
            // bindings to the repetition's "contentAtCurrentIteration".  The
            // repetition delegates "contentAtCurrentIteration" to a mapping
            // from iterations to content, which it can dynamically update as
            // the iterations are reused, thereby updating the bindings.
            this._contentForIteration = Map();
            // We track the direct child nodes of every iteration so we can
            // look up which iteration a mouse or touch event occurs on, for
            // the purpose of selection tracking.
            this._iterationForElement = Map();
            // This variable is updated in the context of deserializing the
            // iteration template so bindings to "contentAtCurrentIteration" are
            // attached to the proper "iteration".  The "_contentForIteration"
            // provides the level of indirection that allows iterations to be
            // paired with different content during their lifetime, but the
            // template and components for each iteration will always be tied
            // to the same Iteration instance.
            this.currentIteration = null;
            // A memo key used by Template.createWithComponent to uniquely
            // identify this repetition (and equivalent instances if this is
            // nested in another repetition) so that it can memoize the
            // template instance:
            this._templateId = null;

            // This promise synchronizes the creation of new iterations.
            this._iterationCreationPromise = Promise.resolve();

            // Where we want to be after the next draw:
            // ---

            // The _boundaries array contains comment nodes that serve as the
            // top and bottom boundary of each iteration.  There will always be
            // one more boundary than iteration.
            this._boundaries = [];

            // The plan for the next draw to synchronize _controllerIterations
            // and iterations on the DOM:
            // ---

            this._dirtyClassListIterations = Set();
            // We can draw when we have created all requested iterations.
            this._requestedIterations = 0;
            this._createdIterations = 0;
            this._canDrawInitialContent = false;
            this._initialContentDrawn = false;

            // Selection gestures
            // ------------------

            this.addOwnPropertyChangeListener("isSelectionEnabled", this);
            // Used by selection tracking (last part of Repetition
            // implementation) to track which selection pointer the repetition
            // is monitoring
            this._selectionPointer = null;
            // This is a list of iterations that are active.  It is maintained
            // entirely by a bidirectional binding to each iteration's "active"
            // property, which in turn manages the "active" class on each
            // element in the iteration in the draw cycle.  Iterations are
            // activated by gestures when selection is enabled, and can also be
            // managed manually for a cursor, as in an autocomplete drop-down.
            // TODO Provide some assurance that the activeIterations will
            // always appear in the same order as they appear in the iterations
            // list.
            this.activeIterations = [];

        }
    },

    /**
     * Prepares this component and all its children for garbage collection
     * (permanently) or reuse.
     *
     * @param permanently whether to cancel bindings on this component
     * and all of its descendants in the component tree.
     */
    cleanupDeletedComponentTree: {
        value: function (permanently) {
            if (this._iterationTemplate) {
                this._teardownIterationTemplate();
            }
            if (permanently) {
                this.cancelBindings();
            }
        }
    },

    // Creating an iteration template:
    // ----

    /**
     * Called by Component to build the component tree, conveniently abused
     * here to set up an iteration template since we know that this method is
     * called after the inner template becomes available and after
     * <code>didCreate</code>.  We must set up the iteration template after
     * creation because the deserializer would interfere with instantiating the
     * inner template.
     * @private
     */
    // TODO @aadsm, are the comments above and below still true, or could we
    // put _setupIterationTemplate in didCreate again?
    expandComponent: {
        value: function expandComponent() {
            // "_isComponentExpanded" is used by Component to determine whether
            // the node of the component object hierarchy is traversable.
            // We can't set up the iteration template during "didCreate"
            // because it would interfere with the active deserialization
            // process.  We wait until the deserialization is complete and the
            // template is fully instantiated so we can capture all the child
            // components and DOM elements.
            if (!this._iterationTemplate) {
                this._setupIterationTemplate();
            }
            this._isComponentExpanded = true;
            return Promise.resolve();
        }
    },

    /**
     * The initial innerTemplate is provided by the Component system and is a
     * facility for cloning the HTML and child components that a repetition
     * contains.  The innerTemplate may be replaced at any time by another
     * component in order to provide an alternate template to repeat.
     * @private
     */
    handleInnerTemplateChange: {
        value: function () {
            if (this._iterationTemplate) {
                this._teardownIterationTemplate();
            }
            this._setupIterationTemplate();
        }
    },

    /**
     * When a template contains a repetition, the deserializer produces a
     * repetition instance that initially contains a single iteration's worth of
     * DOM nodes and components.  To create an iteration template, we must
     * reserialize the repetition component in isolation, with just its element
     * and child components.  To accomplish this, set up a temporary
     * serializer
     *
     * Note that this function must be called on demand for the first iteration
     * needed because it cannot be called in didCreate.  Setting up the
     * iteration template would interfere with normal deserialization.
     *
     * @private
     */
    // TODO aadsm: is all this true still? - @kriskowal
    _setupIterationTemplate: {
        value: function () {

            // We shouldn't set up the iteration template if the repetition
            // received new content, we'll wait until contentDidLoad is called.
            // The problem is that the new components from the new DOM are
            // already in the component tree but not in the DOM, and since this
            // function removes the child components from the repetition we
            // lose them forever.
            // TODO @aadsm: this is part of the chicken-and-egg problem the
            // draw cycle current has, the DrawManager will solve this.
            if (this._newDomContent || this._shouldClearDomContentOnNextDraw) {
                return;
            }

            if (this.innerTemplate.hasParameters()) {
                this._iterationTemplate = this.innerTemplate.clone();
                this._expandIterationTemplateParameters();
            } else {
                this._iterationTemplate = this.innerTemplate;
            }

            // Erase the initial child component trees. The initial document
            // children will be purged on first draw.  We use the innerTemplate
            // as the iteration template and replicate it for each iteration
            // instead of using the initial DOM and components.
            var childComponent;
            // pop() each component instead of shift() to avoid bubbling the
            // indexes of each child component on every iteration.
            while ((childComponent = this.childComponents.pop())) {
                childComponent.needsDraw = false;
                childComponent.cleanupDeletedComponentTree(true); // cancel bindings, permanent
            }

            // Begin tracking the controller organizedContent.  We manually
            // dispatch a range change to track all the iterations that have
            // come and gone while we were not watching.
            this.handleOrganizedContentRangeChange(this.organizedContent, [], 0);
            // Dispatches handleOrganizedContentRangeChange:
            this.organizedContent.addRangeChangeListener(this, "organizedContent");

            this._canDrawInitialContent = true;
            this.needsDraw = true;
        }
    },

    /**
     * This method is used both in <code>cleanupDeletedComponentTree</code> and
     * the internal <code>handleInnerTemplateChange</code> functions, to
     * retract all drawn iterations from the document, prepare all allocated
     * iterations for garbage collection, and pause observation of the
     * controller's iterations.
     * @private
     */
    _teardownIterationTemplate: {
        value: function () {

            // stop listenting to controlled content changes until the new
            // iteration template is ready.  (at which point we will manually
            // dispatch handleOrganizedContentRangeChange with the entire
            // content of the array when _setupIterationTemplate has finished)
            this.organizedContent.removeRangeChangeListener(this, "organizedContent");
            // simulate removal of all iterations from the controller to purge
            // the iterations and _drawnIterations.
            this.handleOrganizedContentRangeChange([], this.organizedContent, 0);

            // prepare all the free iterations and their child component trees
            // for garbage collection
            for (var i = 0; i < this._freeIterations.length; i++) {
                var iteration = this._freeIterations[i];
                for (var j = 0; j < iteration._childComponents.length; j++) {
                    var childComponent = iteration._childComponents[j];
                    childComponent.cleanupDeletedComponentTree(true); // true cancels bindings
                }
            }

            // purge the existing iterations
            this._iterationTemplate = null;
            this._freeIterations.clear();
            this._contentForIteration.clear();
            this._iterationForElement.clear();
            this.currentIteration = null;
            this._templateId = null;
            this._requestedIterations = 0;
            this._createdIterations = 0;
            this._canDrawInitialContent = false;
            this._initialContentDrawn = false;
            this._selectionPointer = null;
            this.activeIterations.clear();
            this._dirtyClassListIterations.clear();
        }
    },

    _expandIterationTemplateParameters: {
        value: function() {
            var template = this._iterationTemplate,
                owner = this,
                argumentsTemplate,
                collisionTable,
                reverseCollisionTable,
                externalLabels,
                objects,
                instances,
                expansionResult,
                newLabel,
                labels,
                metadata;

            // Crawl up the template chain while there are parameters to expand
            // in the iteration template.
            while (template.hasParameters()) {
                owner = owner.ownerComponent;
                argumentsTemplate = owner._ownerDocumentPart.template;
                objects = owner._ownerDocumentPart.objects;

                expansionResult = template.expandParameters(argumentsTemplate, owner);

                // Associate the new external objects with the objects in the
                // instantiation of argumentsTemplate.
                externalLabels = template.getSerialization()
                    .getExternalObjectLabels();
                instances = template.getInstances();

                labels = expansionResult.labels;
                collisionTable = expansionResult.labelsCollisions;

                for (var i = 0, label; (label = labels[i]); i++) {
                    if (collisionTable && label in collisionTable) {
                        newLabel = collisionTable[label];
                    } else {
                        newLabel = label;
                    }

                    // Setup external objects and configure the correct require,
                    // label and owner for the objects that came from the
                    // template arguments.
                    if (externalLabels.indexOf(newLabel) >= 0) {
                        instances[newLabel] = objects[label];
                    } else {
                        metadata = argumentsTemplate.getObjectMetadata(label);
                        if (!metadata.owner) {
                            metadata.owner = objects.owner;
                        }
                        template.setObjectMetadata(newLabel, metadata.require,
                            metadata.label, metadata.owner);
                    }
                }
            }
        }
    },

    // Instantiating an iteration template:
    // ----

    /**
     * We can only create one iteration at a time because it is an asynchronous
     * operation and the "repetition.currentIteration" property may be bound
     * during this process.  If we were to attempt to instantiate multiple
     * iterations asynchronously, currentIteration and contentAtCurrentIteration
     * bindings would get interleaved.  The "_iterationCreationPromise"
     * synchronizes "createIteration", ensuring we only create one at a time,
     * waiting for the previous to either succeed or fail before attempting
     * another.
     * @private
     */
    _iterationCreationPromise: {value: null},

    /**
     * Creates a new iteration and sets up a new instance of the iteration
     * template.  Ensures that only one iteration is being instantiated at a
     * time to guarantee that <code>currentIteration</code> can be reliably
     * bound to the particular iteration.
     * @private
     */
    _createIteration: {
        value: function () {
            var self = this,
                iteration = this.Iteration.create().initWithRepetition(this);

            this._iterationCreationPromise = this._iterationCreationPromise
            .then(function() {
                var _document = self.element.ownerDocument;

                self.currentIteration = iteration;

                var promise = self._iterationTemplate.instantiate(_document)
                .then(function (part) {
                    iteration._childComponents = part.childComponents;
                    iteration._fragment = part.fragment;
                    part.childComponents.forEach(function (component) {
                        self.addChildComponent(component);
                    });
                    part.loadComponentTree().then(function() {
                        self.didCreateIteration(iteration);
                    }).done();
                    self.currentIteration = null;
                })

                promise.done(); // radiate an error if necessary
                return promise.then(null, function () {
                    // but regardless of whether this iteration failed, allow
                    // another iteration to be created
                });
            })

            this._requestedIterations++;
            return iteration;
        }
    },

    /**
     * @private
     */
    // This utility method is shared by two special cases for the completion of
    // _createIteration.
    didCreateIteration: {
        value: function (iteration) {
            this._createdIterations++;

            if (this._createdIterations >= this._requestedIterations) {
                this.needsDraw = true;
                // TODO: When we change the canDraw() function of a component
                // we need to _canDraw = true whenever we request a draw.
                // This is because if the component gets into a state where it
                // is part of the draw cycle but not able to draw (canDraw()
                // === false) its needsDraw property is not set to false and
                // further needsDraw = true will result in a noop, the only way
                // to make the component draw again is by informing the root
                // component directly that it can draw now, and this is done by
                // _canDraw = true. Another option is to make its parent draw,
                // but we probably don't want that.
                this._canDraw = true;
            }
        }
    },

    /**
     * This ties <code>contentAtCurrentIteration</code> to an iteration.
     * <code>currentIteration</code> is only current in the stack of
     * instantiating a template, so this method is a hook that the redirects
     * <code>contentAtCurrentIteration</code> property change listeners to a map
     * change listener on the <code>_contentForIteration</code> map instead.
     * The binding then reacts to changes to the map as iterations are reused
     * with different content at different positions in the DOM.
     * @private
     */
    observeProperty: {
        value: function (key, emit, source, parameters, beforeChange) {
            if (key === "contentAtCurrentIteration" || key === "objectAtCurrentIteration") {
                // delegate to the mapping from iterations to content for the
                // current iteration
                return observeKey(
                    this._contentForIteration,
                    this.currentIteration,
                    emit,
                    source,
                    parameters,
                    beforeChange
                );
            } else if (key === "currentIteration") {
                // Shortcut since this property is sticky -- won't change in
                // the course of instantiating an iteration and should not
                // dispatch a change notification when we instantiate the next.
                return emit(this.currentIteration);
            } else {
                // fall back to normal property observation
                return observeProperty(
                    this,
                    key,
                    emit,
                    source,
                    parameters,
                    beforeChange
                );
            }
        }
    },

    /**
     * This makes bindings to <code>currentIteration</code> stick regardless of
     * how the repetition manipulates the property, and prevents a
     * getter/setter pair from being attached to the property.
     * <code>makePropertyObservable</code> is called by in the
     * <code>listen/property-changes</code> module in the Collections package.
     * @private
     */
    makePropertyObservable: {
        value: function (key) {
            if (key !== "currentIteration") {
                return Montage.makePropertyObservable.call(this, key);
            }
        }
    },

    // Reacting to changes in the controlled visible content:
    // ----

    /**
     * The content controller produces an array of iterations.  The controller
     * may come and go, but each instance of a repetition has its own array to
     * track the corresponding content controller's content, which gets emptied
     * and refilled by a range content binding  when the controller changes.
     * This is to simplify management of the repetition's controller iterations
     * range change listener.
     *
     * The controller iterations themselves instruct the repetition to display
     * an iteration at the corresponding position, and provide a convenient
     * interface for getting and setting whether the corresponding content is
     * selected.
     * @private
     */
    _controllerIterations: {value: null},

    /**
     * The drawn iterations get synchronized with the <code>iterations</code>
     * array each time the repetition draws.  The <code>draw</code> method
     * simply walks down the iterations and drawn iterations arrays, redacting
     * drawn iterations if they are not at the correct position and injecting
     * the proper iteration from the model in its place.
     * @private
     */
    _drawnIterations: {value: null},

    /**
     * @private
     */
    _freeIterations: {value: null},

    /**
     * @private
     */
    _contentForIteration: {value: null},

    /**
     * @private
     */
    _childComponentsPerIteration: {value: null},

    /**
     * Reacts to changes in the controller's organized content by altering the
     * modeled iterations.  This may require additional iterations to be
     * instantiated.  The repetition may redraw when all of the instantiated
     * iterations have finished loading.
     *
     * This method is dispatched in response to changes to the organized
     * content but only while the repetition is prepared to instantiate
     * repetitions.  Any time the repetition needs to change its inner
     * template, or when it is setting up its initial inner template, the
     * repetition silences the organizedContent range change listener and
     * manually calls this method as if organizedContent were cleared out, to
     * cause all of the iterations to be collected and removed from the
     * document.  When the iteration template is ready again, it manually
     * dispatches this method again as if the organizedContent had been
     * repopulated, then resumes listening for changes.
     *
     * Bindings react instantly to the change in the iteration model.  The draw
     * method synchronizes <code>index</code> and <code>_drawnIndex</code> on
     * each iteration as it rearranges <code>_drawnIterations</code> to match
     * the order and content of the <code>iterations</code> array.
     *
     * @private
     */
    handleOrganizedContentRangeChange: {
        value: function (plus, minus, index) {

            // Subtract iterations
            var freedIterations = this.iterations.splice(index, minus.length);
            freedIterations.forEach(function (iteration) {
                // Notify these iterations that they have been recycled,
                // particularly so they know to disable animations with the
                // "no-transition" CSS class.
                iteration.recycle();
            });
            // Add them back to the free list so they can be reused
            this._freeIterations.addEach(freedIterations);
            // Create more iterations if we will need them
            while (this._freeIterations.length < plus.length) {
                this._freeIterations.push(this._createIteration());
            }
            // Add iterations
            this.iterations.swap(index, 0, plus.map(function (content, offset) {
                var iteration = this._freeIterations.pop();
                iteration.content = content;
                // This updates the "repetition.contentAtCurrentIteration"
                // bindings.
                this._contentForIteration.set(iteration, content);
                return iteration;
            }, this));
            // Update indexes for all subsequent iterations
            this._updateIndexes(index);

            this.needsDraw = true;

        }
    },

    /**
     * Used by handleOrganizedContentRangeChange to update the controller index
     * of every iteration following a change.
     * @private
     */
    _updateIndexes: {
        value: function (index) {
            var iterations = this.iterations;
            for (; index < iterations.length; index++) {
                iterations[index].index = index;
            }
        }
    },

    /**
     * @private
     */
    canDraw: {
        value: function () {
            // block for the usual component-related issues
            var canDraw = this.canDrawGate.value;

            // block until we have created enough (iterations to draw
            canDraw = canDraw && this._requestedIterations <= this._createdIterations;
            // block until we can draw initial content if we have not already
            canDraw = canDraw && (this._initialContentDrawn || this._canDrawInitialContent);

            // TODO: we're going to comment this out for now at least because
            // the repetition can get into a dead lock in the case of a nested
            // repetition (a repetition that has another repetition as direct
            // child component). It's possible to get into a state where the
            // inner repetition will never be able to draw unless the outer
            // repetition draws first. Hopefully the DrawManager will be able
            // to solve this. - @aadsm
            // block until all child components can draw
            //if (canDraw) {
            //    for (var i = 0; i < this.childComponents.length; i++) {
            //        var childComponent = this.childComponents[i];
            //        if (!childComponent.canDraw()) {
            //            canDraw = false;
            //        }
            //    }
            //}

            return canDraw;
        }
    },

    /**
     * An array of comment nodes that mark the boundaries between iterations on
     * the DOM.  When an iteration is retracted, the top boundary gets
     * retracted with it so the iteration at index N will always have boundary
     * N above it and N + 1 below it.  There must always be one more boundary
     * than there are iterations, representing the bottom boundary of the last
     * iteration.  That boundary gets added in first draw.
     * @private
     */
    _boundaries: {value: null},

    /**
     * A Set of iterations that have changed their CSS classes that are managed
     * by the repetition, "active", "selected", and "no-transition".
     * @private
     */
    _dirtyClassListIterations: {value: null},

    /**
     * The cumulative number of iterations that _createIteration has started
     * making.
     * @private
     */
    _requestedIterations: {value: null},

    /**
     * The cumulative number of iterations that _createIteration has finished
     * making.
     * @private
     */
    _createdIterations: {value: null},

    /**
     * In the first draw, the repetition gets rid of its innerHTML, which was
     * captured by the innerTemplate, and replaces it with the bottom boundary
     * marker comment.  This cannot be done until after the iteration template
     * is ready.
     *
     * This cycle may occur again if the innerTemplate is replaced.
     * @private
     */
    _canDrawInitialContent: {value: null},

    /**
     * Indicates that the first draw has come and gone and the repetition is
     * ready for business.
     * @private
     */
    _initialContentDrawn: {value: null},

    /**
     * @private
     */
    draw: {
        value: function () {

            if (!this._initialContentDrawn) {
                this._drawInitialContent();
                this._initialContentDrawn = true;
            }

            // Update class lists
            var iterations = this._dirtyClassListIterations.toArray();
            // Note that the iterations list must be cleared first because we
            // remove the "no-transition" class during the update if we find
            // it, which in turn schedules another draw and adds the iteration
            // back to the schedule.
            this._dirtyClassListIterations.clear();
            iterations.forEach(function (iteration) {
                iteration.forEachElement(function (element) {

                    if (iteration.selected) {
                        element.classList.add("selected");
                    } else {
                        element.classList.remove("selected");
                    }

                    if (iteration.active) {
                        element.classList.add("active");
                    } else {
                        element.classList.remove("active");
                    }

                    // While we're at it, if the "no-transition" class has been
                    // added to this iteration, we will need to remove it in
                    // the next draw to allow the iteration to animate.
                    element.classList.remove("no-transition");
                }, this);
            }, this);

            // Synchronize iterations and _drawnIterations

            // Retract iterations that should no longer be visible
            for (var index = this._drawnIterations.length - 1; index >= 0; index--) {
                if (this._drawnIterations[index].index == null) {
                    this._drawnIterations[index].retractFromDocument();
                }
            }

            // Inject iterations if they are not already in the right location
            for (
                var index = 0;
                index < this.iterations.length;
                index++
            ) {
                var iteration = this.iterations[index];
                if (iteration._drawnIndex !== iteration.index) {
                    iteration.injectIntoDocument(index);
                }
            }

        }
    },

    /**
     * @private
     */
    _drawInitialContent: {
        value: function () {
            var element = this.element;
            element.innerHTML = "";
            var bottomBoundary = element.ownerDocument.createTextNode("");
            element.appendChild(bottomBoundary);
            this._boundaries.push(bottomBoundary);
        }
    },

    /**
     * @private
     */
    // Used by the insertion and retraction operations to update the drawn
    // indexes of every iteration following a change.
    _updateDrawnIndexes: {
        value: function (drawnIndex) {
            var drawnIterations = this._drawnIterations;
            for (; drawnIndex < drawnIterations.length; drawnIndex++) {
                drawnIterations[drawnIndex]._drawnIndex = drawnIndex;
            }
        }
    },

    // Selection Tracking
    // ------------------

    /**
     * If <code>isSelectionEnabled</code>, the repetition captures the pointer,
     * preventing it from passing to parent components, for example for the
     * purpose of scrolling.
     * @private
     */
    _selectionPointer: {value: null},

    /**
     * @private
     */
    // Called by didCreate to monitor changes to isSelectionEnabled and arrange
    // the appropriate event listeners.
    handleIsSelectionEnabledChange: {
        value: function (selectionTracking) {
            if (selectionTracking) {
                this._enableSelectionTracking();
            } else {
                this._disableSelectionTracking();
            }
        }
    },

    /**
     * @private
     */
    // Called by handleIsSelectionEnabledChange in response to
    // isSelectionEnabled becoming true.
    _enableSelectionTracking: {
        value: function () {
            this.element.addEventListener("touchstart", this, true);
            this.element.addEventListener("mousedown", this, true);
        }
    },

    /**
     * @private
     */
    // Called by handleIsSelectionEnabledChange in response to
    // isSelectionEnabled becoming false.
    _disableSelectionTracking: {
        value: function () {
            this.element.removeEventListener("touchstart", this, true);
            this.element.removeEventListener("mousedown", this, true);
        }
    },

    // ---

    // Called by captureMousedown and captureTouchstart when a gesture begins:
    /**
     * @param pointerIdentifier an identifier that can be "mouse" or the
     * "identifier" property of a "Touch" in a touch change event.
     * @private
     */
    _observeSelectionPointer: {
        value: function (pointerIdentifier) {
            this._selectionPointer = pointerIdentifier;
            this.eventManager.claimPointer(pointerIdentifier, this);

            var document = this.element.ownerDocument;
            // dispatches handleTouchend
            document.addEventListener("touchend", this, false);
            // dispatches handleTouchcancel
            document.addEventListener("touchcancel", this, false);
            // dispatches handleMouseup
            document.addEventListener("mouseup", this, false);
            // TODO after significant mouse movement or touch movement
            // on the "active" element, forget the selection pointer,
            // deactivate, and do not select.
        }
    },

    /**
     * @private
     */
    _ignoreSelectionPointer: {
        value: function () {
            // The pointer may have been already taken
            if (this.eventManager.isPointerClaimedByComponent(this._selectionPointer, this)) {
                this.eventManager.forfeitPointer(this._selectionPointer, this);
            }
            this._selectionPointer = null;

            this.activeIterations.clear();

            var document = this.element.ownerDocument;
            document.removeEventListener("touchend", this, false);
            document.removeEventListener("touchcancel", this, false);
            document.removeEventListener("mouseup", this, false);
        }
    },

    // ---

    /**
     * @private
     */
    // Dispatched by "mousedown" event listener if isSelectionEnabled
    captureMousedown: {
        value: function (event) {
            this._observeSelectionPointer("mouse");
            var iteration = this._findIterationContainingElement(event.target);
            if (iteration) {
                iteration.active = true;
            } else {
                this._ignoreSelectionPointer();
            }
        }
    },

    /**
     * @private
     */
    // Dispatched by "touchstart" event listener if isSelectionEnabled
    captureTouchstart: {
        value: function (event) {
            if (this._selectionPointer != null) {
                // If we already have one touch making a selection, ignore any
                // others.
                return;
            }

            this._observeSelectionPointer(event.changedTouches[0].identifier);
            var iteration = this._findIterationContainingElement(event.target);
            if (iteration) {
                iteration.active = true;
            } else {
                this._ignoreSelectionPointer();
            }
        }
    },

    // ---

    /**
     * @private
     */
    handleTouchend: {
        value: function (event) {
            // TODO consider only grabbing touches that are in target touches
            for (var i = 0; i < event.changedTouches.length; i++) {
                if (this._endSelectionOnTarget(event.changedTouches[i].identifier, event.target)) {
                    break;
                }
            }

        }
    },

    /**
     * @private
     */
    handleTouchcancel: {
        value: function () {
            this._ignoreSelectionPointer();
        }
    },

    /**
     * @private
     */
    handleMouseup: {
        value: function (event) {
            this._endSelectionOnTarget("mouse", event.target);
        }
    },

    /**
     * @private
     */
    _endSelectionOnTarget: {
        value: function (identifier, target) {

            if (identifier !== this._selectionPointer) {
                return;
            }

            if (this.eventManager.isPointerClaimedByComponent(this._selectionPointer, this)) {
                // Find the corresponding iteration
                var iteration = this._findIterationContainingElement(target);
                // And select it, if there is one
                if (iteration) {
                    iteration.active = false;
                    iteration.selected = !iteration.selected;
                }
            }

            this._ignoreSelectionPointer();

            return true;
        }
    },

    // ---

    /**
     * Finds the iteration that contains an element within the repetition.
     * This requires the repetition to maintain an index of all of the
     * <em>shallow</em> child elements of an iteration, _iterationForElement.
     * It does so in the Iteration.injectIntoDocument, but is only
     * approximately accurate since technically the child components of an
     * iteration may add and remove siblings after injection.  For the sake of
     * simplicity, we ignore these dynamic elements for the purpose of
     * selection.  Also, as such, this method may return undefined.
     * @private
     */
    _findIterationContainingElement: {
        value: function (element) {
            // Walk the document upward until we find the repetition and
            // a direct child of the repetition element.  The direct
            // child must be tracked by the repetition.
            var child;
            while (element) {
                if (element === this.element) {
                    return this._iterationForElement.get(child);
                }
                child = element;
                element = element.parentNode;
            }
        }
    },

    // Polymorphic helper types
    // ------------------------

    /**
     * The Iteration type for this repetition.  The repetition calls
     * <code>this.Iteration.create()</code> to make new instances of
     * iterations, so a child class of <code>Repetition</code> may provide an
     * alternate implementation of <code>Iteration</code>.
     */
    Iteration: { value: Iteration, serializable: false }

});

