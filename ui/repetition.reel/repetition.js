"use strict";

var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Template = require("ui/template").Template;
var ContentController = require("ui/controller/content-controller").ContentController;

var Map = require("collections/map");

var Observers = require("frb/observers");
var observeProperty = Observers.observeProperty;
var observeKey = Observers.observeKey;

/**
 * A reusable view-model for each iteration of a repetition.  Each iteration
 * corresponds to a visible object.  When an iteration is visible, it is
 * tied to the corresponding controller-model which carries which object
 * the iteration is coupled to, and whether it is selected.
 */
var Iteration = exports.Iteration = Montage.create(Montage, {

    didCreate: {
        value: function () {
            Object.getPrototypeOf(Iteration).didCreate.call(this);
            this.repetition = null;
            // A temporary place-holder for the element in the iteration
            // template instantiation process
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
            // TODO doc
            this.visibleIndex = null;
            // The controller has its own model of iterations that includes
            this.controller = null;
            // Adding an iteration to the document stops any animations that
            // may have been active when it was last on the document by adding
            // a no-transition CSS class.  This class must be removed on
            // the next draw cycle.
            this.needsEnableTransitions = false;
            this.active = false;
            this.addOwnPropertyChangeListener("active", this);
            this.selected = false;
            this.addOwnPropertyChangeListener("selected", this);
            this.defineBinding("selected", {"<->": "controller.selected"});
            this.defineBinding("object", {"<->": "controller.object"});
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

            // add a new top boundary before the next iteration
            var topBoundary = element.ownerDocument.createComment("");
            var bottomBoundary = repetition.boundaries[visibleIndex]; // previous
            repetition.boundaries.splice(visibleIndex, 0, topBoundary);
            element.insertBefore(topBoundary, bottomBoundary);

            // inject the elements into the document
            element.insertBefore(this.fragment, bottomBoundary);

            // disable transitions for the injected elements
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
            repetition.iterationsNeedReenableTransitions = true;
            repetition.needsDraw = true;

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

    handleSelectedChange: {
        value: function (selected) {
            // This event is only relevant after initialization
            if (!this.repetition)
                return;
            var repetition = this.repetition;
            var operation;
            if (selected) {
                operation = repetition.SelectOperation.create().initWithIteration(this);
            } else {
                operation = repetition.DeselectOperation.create().initWithIteration(this);
            }
            repetition.pendingOperations.push(operation);
            repetition.needsDraw = true;
        }
    },

    handleActiveChange: {
        value: function (active) {
            // TODO visualize
        }
    }

});

// Operations are tracked in a List of Operations on a Repetition and then
// executed in the "draw" imperative to add and remove Iterations at particular
// positions.

var ContentChangeOperation = exports.ContentChangeOperation = Montage.create(Montage, {

    didCreate: {
        value: function () {
            Object.getPrototypeOf(ContentChangeOperation).didCreate.call(this);
            this.controller = null;
            this.visibleIndex = null;
        }
    },

    initWithControllerAndVisibleIndex: {
        value: function (controller, visibleIndex) {
            this.controller = controller;
            this.visibleIndex = visibleIndex;
            return this;
        }
    }

});

var DeleteOperation = exports.AddOperation = Montage.create(ContentChangeOperation, {
    draw: {
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
    }
});

var AddOperation = exports.AddOperation = Montage.create(ContentChangeOperation, {
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

var SelectionChangeOperation = exports.SelectionChangeOperation = Montage.create(Montage, {
    didCreate: {
        value: function () {
            Object.getPrototypeOf(SelectionChangeOperation).didCreate.call(this);
            this.iteration = null;
        }
    },
    initWithIteration: {
        value: function (iteration) {
            this.iteration = iteration;
            return this;
        }
    }
});

var DeselectOperation = exports.DeselectOperation = Montage.create(SelectionChangeOperation, {
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
                    child.classList.remove("selected");
                }
            }
        }
    }
});

var SelectOperation = exports.SelectOperation = Montage.create(SelectionChangeOperation, {
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
                    child.classList.add("selected");
                }
            }

        }
    }
});

var Repetition = exports.Repetition = Montage.create(Component, {

    // For the creator:
    // ----

    initWithObjects: {
        value: function (objects) {
            this.objects = objects;
            return this;
        }
    },

    initWithController: {
        value: function (controller) {
            this.controller = controller;
            return this;
        }
    },

    objects: {
        get: function () {
            if (!this.controller) {
                throw new Error(
                    "Can't get objects: No objects or controller have been " +
                    "assigned to this Repetition"
                );
            }
            return this.controller.objects;
        },
        set: function (objects) {
            this.controller = ContentController.create().initWithObjects(objects);
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
            global.repetition = this; // TODO redact

            // Knobs:
            this.controller = null;
            this.selector = null;
            this.noElement = false;

            // The state of the DOM:
            // ---

            // The template that gets repeated in the DOM
            this.iterationTemplate = null;
            // The "iterations" array tracks "controllerIterations".  Each iteration
            // corresponds to a visible object, by its visible position.  An
            // iteration has a template instance
            this.iterations = [];
            // Iteration objects can be reused.  When an iteration is collected
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
            // from iterations to objects, which it can dynamically update as
            // the iterations are reused, thereby updating the bindings.
            this.objectForIteration = Map();
            // This variable is updated in the context of deserializing the
            // iteration template so bindings to "objectAtCurrentIteration" are
            // attached to the proper "iteration".  The "objectForIteration"
            // provides the level of indirection that allows iterations to be
            // paired with different objects during their lifetime, but the
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
                "<-": "controller.iterations",
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

            // The plan for the next draw to synchronize controllerIterations and
            // iterations on the DOM:
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
            // for instantiating the iterationTemplate.  TODO verify that this
            // will never be a problem since we would never deserialize the
            // repetition instance again
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
                // TODO maybe we don't need to fall back to childComponents[0].uuid, if
                // every component is guaranteed to have _suuid.
                // templateWithComponent is a memoization of the template for its id
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
                // TODO consider instead of waiting for being able to draw,
                // express needsDraw as soon as the iterations are stale and
                // allow canDraw() to allow drawing to proceed when there are
                // enough created iterations.
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
    // objects at different positions in the DOM.
    observeProperty: {
        value: function (key, emit, source, parameters, beforeChange) {
            if (key === "objectAtCurrentIteration") {
                // delegate to the mapping from iterations to objects for the
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

    // Reacting to changes in the controlled visible objects:
    // ----

    // In responses to changes in the controlled controllerIterations array, this
    // method creates a plan to add and delete iterations with their
    // corresponding DOM elements on the next "draw" event.  This may require
    // more iterations to be constructed before the next draw event.
    handleControllerIterationsRangeChange: {
        value: function (plus, minus, visibleIndex) {

            // add pending operations to run in draw
            for (var offset = 0; offset < minus.length; offset++) {
                var operation = this.DeleteOperation.create()
                    .initWithControllerAndVisibleIndex(
                        minus[offset],
                        visibleIndex
                    );
                this.pendingOperations.push(operation);
            }
            for (var offset = 0; offset < plus.length; offset++) {
                var operation = this.AddOperation.create()
                    .initWithControllerAndVisibleIndex(
                        plus[offset],
                        visibleIndex + offset
                    );
                this.pendingOperations.push(operation);
            }

            // produce more iterations if necessary
            this.neededIterations += plus.length - minus.length;
            this.createNeededIterations();
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

    // prepareForDraw: not implemented

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

            // execute the pending add and delete operations
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
            // TODO for each iteration, call cleanupDeletedComponentTree on
            // every component in every iteration.
        }
    },

    Iteration: {
        value: Iteration
    },

    ContentChangeOperation: {
        value: ContentChangeOperation
    },

    AddOperation: {
        value: AddOperation
    },

    DeleteOperation: {
        value: DeleteOperation
    },

    SelectionChangeOperation: {
        value: SelectionChangeOperation
    },

    SelectOperation: {
        value: SelectOperation
    },

    DeselectOperation: {
        value: DeselectOperation
    }

});

// TODO refreshSelectionTracking
// TODO captureTouchstart
// TODO handleTouchend
// TODO handleTouchcancel
// TODO captureMousedown
// TODO handleMouseup
// TODO surrenderPointer
// TODO selectionPointer
// TODO ignoreSelectionPointer
// TODO observeSelectionPointer

// TODO deserializeSelf / serializeSelf that simplifies the "controller" out if possible

