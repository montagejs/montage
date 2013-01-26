"use strict";

var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Template = require("ui/template").Template;
var ContentController = require("core/content-controller").ContentController;

var Map = require("collections/map");

var Observers = require("frb/observers");
var observeProperty = Observers.observeProperty;
var observeKey = Observers.observeKey;

// TODO optimization where plus.length === minus.length

/**
 * A reusable view-model for each iteration of a repetition.  Each iteration
 * corresponds to a visible object.  When an iteration is visible, it is tied
 * to the corresponding controller-model that carries which object the
 * iteration is coupled to, and whether it is selected.
 */
var Iteration = exports.Iteration = Montage.create(Montage, {

    didCreate: {
        value: function () {
            Object.getPrototypeOf(Iteration).didCreate.call(this);
            // The parent repetition component
            this.repetition = null;
            // The repetition gets iterations from its content controller.  The
            // controller is responsible for tracking which iterations are
            // visible and which are selected.  The iteration view-model is
            // attached to the controller view-model by this property, which
            // two-way binds the "selected" and "object" properties.
            this.controller = null;
            this.object = null;
            this.selected = false;
            // The iteration watches whether it is selected.  If the iteration
            // is visible, it enqueue's selection change draw operations and
            // notifies the repetition it needs to be redrawn.
            // Dispatches handlePropertyChange with the "selected" key:
            this.addOwnPropertyChangeListener("selected", this);
            this.defineBinding("selected", {"<->": "controller.selected"});
            this.defineBinding("object", {"<->": "controller.object"});
            // A temporary place-holder for the element in the iteration-
            // template instantiation process.  As soon as possible, the
            // iteration extracts all of its child elements and puts them in
            // the fragment.
            this.element = null;
            // An iteration can be "on" or "off" the document.  When the
            // iteration is added to a document, the "fragment" is depopulated
            // and placed between "topBoundary" and "bottomBoundary" on the
            // DOM.  The repetition manages the boundary markers around each
            // visible index.
            this.fragment = null;
            // The corresponding "object" is tracked in
            // repetition.objectForIteration instead of on the iteration
            // itself.  The bindings in the iteration template react to changes
            // in that map.
            this.childComponents = null;
            // The position that this iteration occupies in the repetition.
            // This is updated whenever views are added or removed before it in
            // the sequence, an operation of linear complexity but which is not
            // onerous since there should be a managable, fixed-maximum number
            // of visible iterations.
            this.visibleIndex = null;
            // Adding an iteration to the document stops any animations that
            // may have been active when it was last on the document by adding
            // a no-transition CSS class.  This class must be removed on
            // the next draw cycle.
            this.needsEnableTransitions = false;

            // Describes whether a user gesture is touching this iteration.
            this.active = false;
            // Changes to whether a user is touching the iteration are
            // reflected by the "active" CSS class on each element in the
            // iteration.  This gets updated in the draw cycle, in response to
            // operations that handleActiveChange adds to the repetition draw
            // cycle.
            // Dispatches handlePropertyChange with the "active" key:
            this.addOwnPropertyChangeListener("active", this);
            this.defineBinding("active", {"<->": "repetition.activeIterations.has(())"});

        }
    },

    initWithRepetition: {
        value: function (repetition) {
            // The repetition property is necessary to communicate changes to
            // the selected property into pending operations queue.
            this.repetition = repetition;

            // The element property is only necessary to communicate from
            // deserializeIteration to templateDidLoad.
            var element = this.element;
            this.element = null;
            var fragment = element.ownerDocument.createDocumentFragment();
            this.fragment = fragment;
            while (element.firstChild) {
                var child = element.firstChild;
                element.removeChild(child);
                fragment.appendChild(child);
            }

        }
    },

    injectIntoDocument: {
        value: function (repetition, visibleIndex) {
            var element = repetition.element;

            // Add a new top boundary before the next iteration
            var topBoundary = element.ownerDocument.createComment("");
            var bottomBoundary = repetition.boundaries[visibleIndex]; // previous
            repetition.boundaries.splice(visibleIndex, 0, topBoundary);
            element.insertBefore(topBoundary, bottomBoundary);

            // Inject the elements into the document
            element.insertBefore(this.fragment, bottomBoundary);

            // Maintain the "iterationForElement" map.
            for (
                var child = topBoundary.nextSibling;
                child !== bottomBoundary;
                child = child.nextSibling
            ) {
                if (child.nodeType === 1) { // tags
                    repetition.iterationForElement.set(child, this);
                }
            }

            // notify the components to wake up and smell the document
            for (var i = 0; i < this.childComponents.length; i++) {
                var childComponent = this.childComponents[i];
                childComponent.needsDraw = true;
            }

            this.visibleIndex = visibleIndex;
        }
    },

    retractFromDocument: {
        value: function (repetition, visibleIndex) {
            var element = repetition.element;
            var topBoundary = repetition.boundaries[visibleIndex];
            var bottomBoundary = repetition.boundaries[visibleIndex + 1];
            // remove the top boundary
            repetition.boundaries.splice(visibleIndex, 1);
            var fragment = this.fragment;
            var child = topBoundary.nextSibling;
            while (child != bottomBoundary) {
                var next = child.nextSibling;
                element.removeChild(child);
                fragment.appendChild(child);
                child = next;
            }
            element.removeChild(topBoundary);
            this.visibleIndex = null;
        }
    },

    // Re-enables CSS transitions on all the elements in a repetition in the
    // draw-cycle after they have been added to the DOM.
    // This must only be called when the iteration is on the document.
    enableTransitions: {
        value: function (repetition, visibleIndex) {
            for (
                var child = repetition.boundaries[visibleIndex];
                child !== repetition.boundaries[visibleIndex + 1];
                child = child.nextSibling
            ) {
                if (child.nodeType === 1) { // tags
                    child.classList.remove("no-transition");
                }
            }
        }
    },

    // Schedules draw operations each time the "selected" or "active" property
    // changes on this iteration.
    handlePropertyChange: {
        value: function (value, key) {
            // This event is only relevant after initialization
            if (!this.repetition)
                return;
            var repetition = this.repetition;
            var operation;
            if (value) {
                operation = repetition.ClassChangeOperation.create().init(
                    this, "add", key
                );
            } else {
                operation = repetition.ClassChangeOperation.create().init(
                    this, "remove", key
                );
            }
            repetition.pendingOperations.push(operation);
            repetition.needsDraw = true;
        }
    }

});

// Operations are tracked in a list of Operations on a Repetition, managed by
// "handleControllerIterationsRangeChange", and then executed in the "draw"
// imperative to add and remove Iterations at particular positions.

// Deletes the iteration at a given visible index
var DeleteOperation = exports.DeleteOperation = Montage.create(Montage, {

    initWithLengthAndVisibleIndex: {
        value: function (length, visibleIndex) {
            this.length = length;
            this.visibleIndex = visibleIndex;
            return this;
        }
    },

    deleteOneIteration: {
        value: function (repetition) {
            // update the model:
            // This dispatches during the draw cycle and gives those listeners
            // an opportunity to work while the elements and components are
            // still on the DOM and bound properly.
            var iteration = repetition.iterations.splice(this.visibleIndex, 1)[0];
            repetition.updateVisibleIndexes(this.visibleIndex);
            // update the bindings:
            iteration.controller = null;
            repetition.objectForIteration.set(iteration, null);
            // update the document:
            iteration.retractFromDocument(repetition, this.visibleIndex);
            // recycle the iteration:
            repetition.freeIterations.push(iteration);
        }
    },

    draw: {
        value: function (repetition) {
            for (var index = 0; index < this.length; index++) {
                this.deleteOneIteration(repetition);
            }
        }
    }

});

// Interpolates an iteration at a given visible index
var AddOperation = exports.AddOperation = Montage.create(Montage, {
    initWithControllerAndVisibleIndex: {
        value: function (controller, visibleIndex) {
            this.controller = controller;
            this.visibleIndex = visibleIndex;
            return this;
        }
    },
    draw: {
        value: function (repetition) {
            // recycle the iteration:
            var iteration = repetition.freeIterations.pop();
            // update the document:
            iteration.injectIntoDocument(repetition, this.visibleIndex);
            // update the bindings:
            repetition.objectForIteration.set(iteration, this.controller.object);
            iteration.controller = this.controller;
            // update the model:
            // This dispatches events in the draw cycle.  Others may depend on
            // those events to occur after the element has been placed on the
            // DOM and bindings reified.
            repetition.iterations.splice(this.visibleIndex, 0, iteration);
            repetition.updateVisibleIndexes(this.visibleIndex);
        }
    }
});

// A change operation is an optimization for the case where a block of
// iterations is being replaced with another block of iterations of the same
// length.  It bypasses DOM manipulation and performs all changes entirely by
// rebinding the existing iterations.
var ReplaceOperation = exports.ReplaceOperation = Montage.create(Montage, {

    initWithControllersAndVisibleIndex: {
        value: function (controllers, visibleIndex) {
            this.controllers = controllers;
            this.visibleIndex = visibleIndex;
            return this;
        }
    },

    draw: {
        value: function (repetition) {
            var visibleIndex = this.visibleIndex;
            var controllers = this.controllers;
            for (var index = 0; index < controllers.length; index++) {
                var controller = this.controllers[index];
                var iteration = repetition.iterations[visibleIndex + index];

                if (iteration.controller === controller)
                    continue;

                iteration.controller = controller;
                repetition.objectForIteration.set(iteration, controller.object);

                // Disable transitions for the reused elements.
                for (
                    var child = topBoundary.nextSibling;
                    child !== bottomBoundary;
                    child = child.nextSibling
                ) {
                    if (child.nodeType === 1) { // tags
                        child.classList.add("no-transition");
                    }
                }

                this.needsEnableTransitions = true;
            }
            repetition.iterationsNeedReenableTransitions = true;
            repetition.needsDraw = true;
        }
    }

});

// Adds, removes, or toggles a class on every child element of the iteration at
// a visible index.
var ClassChangeOperation = exports.ClassChangeOperation = Montage.create(Montage, {

    init: {
        value: function (iteration, action, className) {
            this.iteration = iteration;
            this.action = action;
            this.className = className;
            return this;
        }
    },

    draw: {
        value: function () {
            var iteration = this.iteration;
            if (iteration.visibleIndex === null)
                return;
            var repetition = iteration.repetition;
            var visibleIndex = iteration.visibleIndex;
            for (
                var child = repetition.boundaries[visibleIndex];
                child !== repetition.boundaries[visibleIndex + 1];
                child = child.nextSibling
            ) {
                if (child.nodeType === 1) { // tags
                    child.classList[this.action](this.className);
                }
            }
        }
    }
});

// Here it is, what we have all been waiting for, the prototype of the hour...
var Repetition = exports.Repetition = Montage.create(Component, {

    // For the creator:
    // ----

    initWithContent: {
        value: function (content) {
            this.content = content;
            return this;
        }
    },

    initWithController: {
        value: function (contentController) {
            this.contentController = contentController;
            return this;
        }
    },

    content: {
        get: function () {
            if (!this.contentController) {
                return null;
            }
            return this.contentController.content;
        },
        set: function (content) {
            if (this.contentController) {
                this.contentController.content = content;
            } else {
                this.contentController = ContentController.create().initWithContent(content);
            }
        }
    },

    // For the template:
    // ----

    // Informs the super-type, Component, that there is no repetition.html
    hasTemplate: {value: false},

    // informs Template that it is not safe to clone the DOM of the
    // corresponding element. TODO @aadsm, please explain this better, here and
    // in Component.  - @kriskowal.
    clonesChildComponents: {value: true},

    // Implementation:
    // ----

    didCreate: {
        value: function () {
            Object.getPrototypeOf(Repetition).didCreate.call(this);

            // Knobs:
            this.contentController = null;
            // Determines whether the repetition listens for mouse and touch
            // events to select iterations, which involves "activating" the
            // iteration when the user touches.
            this.isSelectionEnabled = false;
            this.defineBinding("selectedIterations", {
                "<-": "iterations.filter{selected}",
                "serializable": false
            });
            this.defineBinding("selection", {
                "<->": "contentController.selection",
                "serializable": false
            });

            // The state of the DOM:
            // ---

            // The template that gets repeated in the DOM
            this.iterationTemplate = null;
            // The "iterations" array tracks "controllerIterations".  Each iteration
            // corresponds to a visible object, by its visible position.  An
            // iteration has a template instance
            this.iterations = [];
            // Iteration content can be reused.  When an iteration is collected
            // (and when it is initially created), it gets put in the
            // freeIterations list.
            this.freeIterations = []; // push/pop LIFO
            // Iterations that need a template instance: We cannot draw until
            // all of the iterations (free or otherwise, for simplicity's sake)
            // have templates.
            this.iterationsNeedingTemplates = [];
            // Whenever an iteration template is instantiated, it may have
            // bindings to the repetition's "objectAtCurrentIteration".  The
            // repetition delegates "objectAtCurrentIteration" to a mapping
            // from iterations to content, which it can dynamically update as
            // the iterations are reused, thereby updating the bindings.
            this.objectForIteration = Map();
            // We track the direct child nodes of every iteration so we can
            // look up which iteration a mouse or touch event occurs on, for
            // the purpose of selection tracking.
            this.iterationForElement = Map();
            // This variable is updated in the context of deserializing the
            // iteration template so bindings to "objectAtCurrentIteration" are
            // attached to the proper "iteration".  The "objectForIteration"
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

            // Where we want to be after the next draw:
            // ---

            this.controllerIterations = [];
            // dispatches to this.handleControllerIterationsRangeChange:
            this.controllerIterations.addRangeChangeListener(
                this,
                "controllerIterations"
            );
            // Ascertains that controllerIterations does not get changed by the
            // controller, but the changes are projected on our array.
            this.defineBinding("controllerIterations.*", {
                "<-": "contentController.iterations",
                "serializable": false
            });
            // The boundaries array contains comment nodes that serve as the
            // top and bottom boundary of each iteration.  There will always be
            // one more boundary than iteration.
            this.boundaries = [];
            // The child components of each iteration will be shared in the
            // repetitions own childComponents.  Since each repetition
            // consistently has the same number of childComponents, we can
            // project changes to the components array based on the
            // visibleIndex of the iteration and this figure:
            this.iterationChildComponentsLength = 0;

            // The plan for the next draw to synchronize controllerIterations
            // and iterations on the DOM:
            // ---

            // All of the "add" and "delete" operations planned for the next
            // draw.
            this.pendingOperations = [];
            // The number of iterations, plus the number of planned
            // additions minus the number of planned deletions on the next
            // draw.
            this.neededIterations = 0;
            this.requestedIterations = 0;
            this.createdIterations = 0;
            // We have to keep the HTML content of the repetition in tact until
            // it has been captured by setupIterationTemplate.  Unfortunately,
            // we can't set up the iteration template in this turn of the event
            // loop because it would interfere with deserialization, so this is
            // usually deferred to the first draw.
            this.canDrawInitialContent = false;
            // Indicates that the elements from the template have been erased.
            // Setting this to true allows those elements to be erased in the
            // next draw.
            this.initialContentDrawn = false;
            // This flag indicates that iterations have been added to the
            // document in the current or previous draw cycle.  This indicates
            // that another draw is needed to reenable CSS transitions on the
            // injected iterations.
            this.iterationsNeedReenableTransitions = false;

            // Selection gestures
            // ------------------

            this.addOwnPropertyChangeListener("isSelectionEnabled", this);
            // Used by selection tracking (last part of Repetition
            // implementation) to track which selection pointer the repetition
            // is monitoring
            this.selectionPointer = null;
            // This is a list of iterations that are active.  It is maintained
            // entirely by a bidirectional binding to each iteration's "active"
            // property, which in turn manages the "active" class on each
            // element in the iteration in the draw cycle.
            this.activeIterations = [];

        }
    },

    // Creating an iteration template:
    // ----

    deserializedFromTemplate: {
        value: function () {
            // We can't set up the iteration template during didCreate because
            // it would interfere with the active deserialization process.  We
            // wait until the deserialization is complete and the template is
            // fully instantiated so we can capture all the child components
            // and DOM elements.
            this.setupIterationTemplate();
        }
    },

    // This prevents the deserializer from reinstantiating the ownerComponent.
    // TODO @aadsm please verify - @kriskowal
    templateDidDeserializeObject: {
        value: null
    },

    /*
    * When a template contains a repetition, the deserializer produces a
    * repetition instance that initially contains a single iteration's worth of
    * DOM nodes and components.  To create an iteration template, we must
    * reserialize the repetition component in isolation, with just its element
    * and child components.  To accomplish this, set up a temporary serializer
    *
    * Note that this function must be called on demand for the first iteration
    * needed because it cannot be called in didCreate.  Setting up the
    * iteration template would interfere with normal deserialization.
    */
    setupIterationTemplate: {
        value: function () {

            // override the prototype's serialization routine on just this
            // instance temporarily:
            this.serializeSelf = this.serializeIteration;
            // permanently override deserializeProperties because it is used
            // for instantiating the iterationTemplate.
            this.deserializeProperties = this.deserializeIteration;

            this.iterationChildComponentsLength = this.childComponents.length;

            // create an iteration template
            if (this.childComponents.length > 0) {
                // The common case (components and a document fragment).
                // The templateId property is used by ui/template.js as a memo
                // key.  Use the first contained component's UUID to uniquely
                // identify this template.  Use the _suuid to ascertain that
                // only one key exists, even if the repetition is nested.
                this._templateId = (
                    this.childComponents[0]._suuid || // Assigned by Serialization
                    this.childComponents[0].uuid // Assigned by Montage
                );
                // TODO @aadsm, maybe we don't need to fall back to
                // childComponents[0].uuid, if every component is guaranteed to
                // have _suuid.  templateWithComponent is a memoization of the
                // template for its id - @kriskowal
                this.iterationTemplate = Template.templateWithComponent(
                    this,
                    this.templateDelegate
                );
            } else {
                // The optimized case (just a document fragment, no components)
                this.iterationTemplate = Template.create();
                this.iterationTemplate.delegate = this.templateDelegate;
                this.iterationTemplate.initWithComponent(this);
            }
            this.iterationTemplate.optimize();

            // this restores serializeSelf to the one on the prototype chain:
            delete this.serializeSelf;

            // the components inside the repetition in the markup are going to
            // be instantiated once when the component is initially
            // deserialized, but only for the purpose of reserializing them for
            // the iteration template, and then removed.  This removes the
            // initial components and ascertains that we waste no time dawing
            // them.
            var childComponent;
            while ((childComponent = this.childComponents.shift())) {
                childComponent.needsDraw = false;
            }

            // In case some iterations have been requested before the iteration
            // template was ready to go.  Iterations are requested during
            // handleControllerIterationsRangeChange.
            this.createNeededIterations();

            this.canDrawInitialContent = true;
            this.needsDraw = true;
        }
    },

    // This method temporarily replaces "serializeSelf" for the purpose of
    // creating an iteration template from the initial HTML content and
    // childComponents of a fresh repetition instance.
    serializeIteration: {
        value: function (serializer) {
            serializer.setProperty("element", this.element);
            for (var i = 0; i < this.childComponents.length; i++) {
                serializer.addObject(this.childComponents[i]);
            }
            serializer.setProperty("_isComponentExpanded", true);
        }
    },

    // This template delegate object is shared by all repetitions and receives
    // all meaningful state in arguments.
    templateDelegate: {
        value: {
            // This method gets called by the Template initializer on behalf of
            // setupIterationTemplate
            serializeObjectProperties: function(serialization, object) {
                serialization.set(
                    "ownerComponent",
                    object.ownerComponent,
                    "reference"
                );
            }
        }
    },

    // Instantiating an iteration template:
    // ----

    createIteration: {
        value: function () {
            var self = this;
            var iteration = Iteration.create();
            this.iterationsNeedingTemplates.push(iteration);
            this.iterationTemplate.instantiateWithComponent(this, function () {

                // The iteration has been created.  We need to expand the child
                // components and their transitive children.  For the special
                // case of a repetition that only has HTML and no components,
                // we skip that process.
                if (self.iterationChildComponentsLength === 0) {
                    iteration.childComponents = [];
                    self.didCreateIteration();
                } else {
                    // All of the child components created by instantiating the
                    // iteration template will be at the end of the repetition
                    // childComponents.  We know how many child components
                    // should be generated, so we count back from the end of
                    // the array and add those childComponents to the
                    // iteration.
                    var start = self.childComponents.length -
                        self.iterationChildComponentsLength;
                    var end = self.childComponents.length;
                    var childComponents = self.childComponents.slice(start, end);
                    // Add the list of child components to the iteration
                    // so that it can call needsDraw on them whenever it is
                    // returned to the document.
                    iteration.childComponents = childComponents;
                    // Build out the child component hierarchy.

                    for (var i = 0; i < childComponents.length; i++) {
                        var childComponent = childComponents[i];
                        childComponent.needsDraw = true;
                        childComponent.loadComponentTree(function () {
                            self.didCreateIteration();
                        });
                    }

                }

            });
            this.requestedIterations++;
            return iteration;
        }
    },

    // This utility method is shared by two special cases for the completion of
    // createIteration.
    didCreateIteration: {
        value: function () {
            this.createdIterations++;
            if (
                this.createdIterations >= this.neededIterations ||
                this.pendingOperations.length
            ) {
                this.needsDraw = true;
            }
        }
    },

    // After the repetition itself has been deserialized, setupIterationTemplate
    // overwrites deserializeProperties with deserializeIteration so that
    // deserializing the repetition produces iteration template instances
    // instead of repetitions.
    //
    // When this is used to instantiate a template, it finds an iteration that
    // needs a template in iterationsNeedingTemplates and sets that to the
    // "currentIteration".  Since deserialization is entirely synchronous, we
    // can count on "currentIteration" to be associated with any bindings to
    // "objectAtCurrentIteration" while the iteration is being instantiated.
    // We use "objectForIteration" to update the corresponding object when
    // the iteration is added to (or reused on) the view.
    //
    // This also captures the document fragment of the instantiated template
    // and adds the elements to the event manager.
    deserializeIteration: {
        value: function (deserializer) {
            var iteration = this.iterationsNeedingTemplates.pop();
            this.currentIteration = iteration;
            iteration.element = deserializer.get("element");
            this.eventManager.registerEventHandlerForElement(
                this,
                iteration.element
            );
        }
    },

    // This is the last handler dispatched by iterationTemplate.initWithComponent,
    // wherein we mark the currentIteration as fully loaded.  This all happens in
    // the same event as deserialization so there is no chance of interleaving with
    // other iterations.
    templateDidLoad: {
        value: function () {
            var iteration = this.currentIteration;
            if (!iteration) {
                throw new Error(
                    "Assertion error: templateDidLoad should only be called " +
                    "after deserializeProperties so there should always be " +
                    "a currentIteration"
                );
            }

            // populate the document fragment for the iteration from the
            // content of the element
            iteration.initWithRepetition(this);

            this.currentIteration = null;
        }
    },

    // This ties "objectAtCurrentIteration" to an iteration.
    // "currentIteration" is only current in the stack of instantiating a
    // template, so this method is a hook that the redirects
    // "objectAtCurrentIteration" property change listeners to a map change
    // listener on the "objectForIteration" map instead.  The binding then
    // reacts to changes to the map as iterations are reused with different
    // content at different positions in the DOM.
    observeProperty: {
        value: function (key, emit, source, parameters, beforeChange) {
            if (key === "objectAtCurrentIteration") {
                // delegate to the mapping from iterations to content for the
                // current iteration
                return observeKey(
                    this.objectForIteration,
                    this.currentIteration,
                    emit,
                    source,
                    parameters,
                    beforeChange
                );
            } else if (key === "currentIteration") {
                // Shortcut since this property is sticky.
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

    // This makes bindings to "currentIteration" stick regardless of how the
    // repetition manipulates the property, and prevents a getter/setter pair
    // from being attached to the property.
    makePropertyObservable: {
        value: function (key) {
            if (key !== "currentIteration") {
                return Montage.makePropertyObservable.call(this, key);
            }
        }
    },

    // Reacting to changes in the controlled visible content:
    // ----

    // In responses to changes in the controlled controllerIterations array, this
    // method creates a plan to add and delete iterations with their
    // corresponding DOM elements on the next "draw" event.  This may require
    // more iterations to be constructed before the next draw event.
    handleControllerIterationsRangeChange: {
        value: function (plus, minus, visibleIndex) {

            var diff = plus.length - minus.length;

            // produce more iterations if necessary
            this.neededIterations += diff;

            if (diff < 0) {

                // delete the difference
                var operation = this.DeleteOperation.create()
                    .initWithLengthAndVisibleIndex(
                        -diff,
                        visibleIndex
                    );
                this.pendingOperations.push(operation);
                if (plus.length) {
                    // then change the remaining
                    var operation = this.ReplaceOperation.create()
                        .initWithControllersAndVisibleIndex(plus, visibleIndex);
                    this.pendingOperations.push(operation);
                }

            } else { // diff >= 0
                this.createNeededIterations();

                // reuse all of the iterations presently in the region being
                // deleted
                var operation = this.ReplaceOperation.create()
                    .initWithControllersAndVisibleIndex(
                        plus.splice(0, minus.length),
                        visibleIndex
                    );
                this.pendingOperations.push(operation);
                // then add iterations for the remaining
                for (var offset = 0; offset < plus.length; offset++) {
                    var operation = this.AddOperation.create()
                        .initWithControllerAndVisibleIndex(
                            plus[offset],
                            visibleIndex + minus.length + offset
                        );
                    this.pendingOperations.push(operation);
                }

            }

            this.needsDraw = true;

        }
    },

    createNeededIterations: {
        value: function () {
            // If the iteration template is not yet ready, we postpone until
            // after that has been set up.  setupIterationTemplate calls this
            // method to make sure they're not forgotten.
            if (!this.iterationTemplate) {
                return;
            }
            while (this.neededIterations > this.requestedIterations) {
                this.freeIterations.push(this.createIteration());
            }
        }
    },


    // Drawing
    // ----

    expandComponent: {
        value: function expandComponent(callback) {
            // _isComponentExpanded is Used by Component to determine whether
            // the node of the component object hierarchy is traversable:
            this._isComponentExpanded = true;
            if (callback) {
                callback();
            }
        }
    },

    canDraw: {
        value: function () {
            // block for the usual component-related issues
            var canDraw = this.canDrawGate.value;
            // block until we have created enough iterations to draw
            canDraw = canDraw && this.neededIterations <= this.createdIterations;
            // block until we can draw initial content if we have not already
            canDraw = canDraw && (this.initialContentDrawn || this.canDrawInitialContent);
            // block until all child components can draw
            if (canDraw) {
                for (var i = 0; i < this.childComponents.length; i++) {
                    var childComponent = this.childComponents[i];
                    if (!childComponent.canDraw()) {
                        canDraw = false;
                    }
                }
            }
            return canDraw;
        }
    },

    draw: {
        value: function () {

            if (!this.initialContentDrawn) {
                this.drawInitialContent();
                this.initialContentDrawn = true;
            }

            // reenable CSS transitions on the elements of any iterations that
            // were injected in the previous draw cycle.  Rather than attempt
            // to compute which iterations were added but not removed in the
            // last draw cycle, each iteration is rather marked with the
            // "needsEnableTransitions" flag.
            if (this.iterationsNeedReenableTransitions) {
                for (
                    var visibleIndex = 0;
                    visibleIndex < this.iterations.length;
                    visibleIndex++
                ) {
                    var iteration = this.iterations[visibleIndex];
                    if (iteration.needsEnableTransitions) {
                        iteration.enableTransitions(this, visibleIndex);
                        iteration.needsEnableTransitions = false;
                    }
                }
            }

            // TODO optimize pending operations, pairing add and delete
            // operations and assembling them into replacement operations,
            // to minimize the impact on the document.

            // execute the pending draw operations (add, delete, select,
            // deselect, activate, deactivate)
            var pendingOperations = this.pendingOperations;
            pendingOperations.forEach(function (operation) {
                operation.draw(this);
            }, this);
            pendingOperations.clear();

        }
    },

    drawInitialContent: {
        value: function () {
            var element = this.element;
            element.innerHTML = "";
            var bottomBoundary = element.ownerDocument.createComment("");
            element.appendChild(bottomBoundary);
            this.boundaries.push(bottomBoundary);
        }
    },

    // Used by the Add and Delete operations to update the visible indexes
    // of every iteration following a change.
    updateVisibleIndexes: {
        value: function (visibleIndex) {
            var iterations = this.iterations;
            for (; visibleIndex < iterations.length; visibleIndex++) {
                iterations[visibleIndex].visibleIndex = visibleIndex;
            }
        }
    },

    cleanupDeletedComponentTree: {
        value: function (pleaseCancelBindings) {
            if (pleaseCancelBindings) {
                this.cancelBindings();
            }
            this.controllerIterations.removeMapChangeListener(this);
            for (var i = 0; i < this.iterations.length; i++) {
                var iteration = this.iterations[i];
                for (var j = 0; j < iteration.childComponents.length; j++) {
                    var childComponent = iteration.childComponents[j];
                    childComponent.cleanupDeletedComponentTree(pleaseCancelBindings);
                }
            }
        }
    },

    // Selection Tracking
    // ------------------

    // Called by didCreate to monitor changes to isSelectionEnabled and arrange
    // the appropriate event listeners.
    handleIsSelectionEnabledChange: {
        value: function (selectionTracking) {
            if (selectionTracking) {
                this.enableSelectionTracking();
            } else {
                this.disableSelectionTracking();
            }
        }
    },

    // Called by handleIsSelectionEnabledChange in response to
    // isSelectionEnabled becoming true.
    enableSelectionTracking: {
        value: function () {
            this.element.addEventListener("touchstart", this, true);
            this.element.addEventListener("mousedown", this, true);
        }
    },

    // Called by handleIsSelectionEnabledChange in response to
    // isSelectionEnabled becoming false.
    disableSelectionTracking: {
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
     */
    observeSelectionPointer: {
        value: function (pointerIdentifier) {
            this.selectionPointer = pointerIdentifier;
            this.eventManager.claimPointer(pointerIdentifier, this);

            var document = this.element.ownerDocument;
            // dispatches handleTouchend
            document.addEventListener("touchend", this, false);
            // dispatches handleTouchcancel
            document.addEventListener("touchcacnel", this, false);
            // dispatches handleMouseup
            document.addEventListener("mouseup", this, false);
            // TODO after significant mouse movement or touch movement
            // on the "active" element, forget the selection pointer,
            // deactivate, and do not select.
        }
    },

    ignoreSelectionPointer: {
        value: function () {
            // The pointer may have been already taken
            if (this.eventManager.isPointerClaimedByComponent(this.selectionPointer, this)) {
                this.eventManager.forfeitPointer(this.selectionPointer, this);
            }
            this.selectionPointer = null;

            this.activeIterations.clear();

            var document = this.element.ownerDocument;
            document.removeEventListener("touchend", this, false);
            document.removeEventListener("touchcancel", this, false);
            document.removeEventListener("mouseup", this, false);
        }
    },

    // ---

    // Dispatched by "mousedown" event listener if isSelectionEnabled
    captureMousedown: {
        value: function (event) {
            this.observeSelectionPointer("mouse");
            var iteration = this.findIterationContainingElement(event.target);
            if (iteration) {
                iteration.active = true;
            } else {
                this.ignoreSelectionPointer();
            }
        }
    },

    // Dispatched by "touchstart" event listener if isSelectionEnabled
    captureTouchstart: {
        value: function (event) {
            if (this.selectionPointer != null) {
                // If we already have one touch making a selection, ignore any
                // others.
                return;
            }

            this.observeSelectionPointer(event.changedTouches[0].identifier);
            var iteration = this.findIterationContainingElement(event.target);
            if (iteration) {
                iteration.active = true;
            } else {
                this.ignoreSelectionPointer();
            }
        }
    },

    // ---

    handleTouchend: {
        value: function (event) {
            // TODO consider only grabbing touches that are in target touches
            // Find the changed touch that refers to our selection pointer.
            // Find the touch corresponding to the handleTouchstart
            for (var i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === this.selectionPointer) {
                    // Only if we retained our claim on that pointer
                    if (this.eventManager.isPointerClaimedByComponent(this.selectionPointer, this)) {
                        // Find the corresponing iteration
                        var iteration = this.findIterationForElement(event.target);
                        // And select it, if there is one
                        if (iteration) {
                            iteration.selected = !iteration.selected;
                        }
                    }
                    this.ignoreSelectionPointer();
                    return;
                }
            }

        }
    },

    handleTouchcancel: {
        value: function () {
            this.ignoreSelectionPointer();
        }
    },

    handleMouseup: {
        value: function (event) {
            var iteration = this.findIterationContainingElement(event.target);
            if (iteration) {
                iteration.active = false;
                iteration.selected = !iteration.selected;
            }
            this.ignoreSelectionPointer();
        }
    },

    // ---

    // Finds the iteration that contains an element within the repetition.
    // This requires the repetition to maintain an index of all of the
    // *shallow* child elements of an iteration, iterationForElement.  It does
    // so in the Iteration.injectIntoDocument, but is only approximately
    // accurate since technically the child components of an iteration may add
    // and remove siblings after injection.  For the sake of simplicity, we
    // ignore these dynamic elements for the purpose of selection.  Also, as
    // such, this method may return undefined.
    findIterationContainingElement: {
        value: function (element) {
            // Walk the document upward until we find the repetition and
            // a direct child of the repetition element.  The direct
            // child must be tracked by the repetition.
            var child;
            while (element) {
                if (element === this.element) {
                    return this.iterationForElement.get(child);
                }
                child = element;
                element = element.parentNode;
            }
        }
    },

    // Polymorphic helper types
    // ------------------------

    Iteration: { value: Iteration, serializable: false },
    AddOperation: { value: AddOperation, serializable: false },
    DeleteOperation: { value: DeleteOperation, serializable: false },
    ReplaceOperation: { value: ReplaceOperation, serializable: false },
    ClassChangeOperation: { value: ClassChangeOperation, serializable: false }

});

// TODO deserializeSelf / serializeSelf that simplifies the "controller" out if
// possible, that is, if the controller is a ContentController, just steal its
// "content" property and all bindings to it and put them on the repetition.
// Unpossible?  Probably.

