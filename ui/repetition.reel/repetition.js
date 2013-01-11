"use strict";

var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Template = require("ui/template").Template;
var Map = require("collections/map");
var Observers = require("frb/observers");
var observeProperty = Observers.observeProperty;
var observeKey = Observers.observeKey;

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
            // TODO better than DumbController
            this.controller = DumbController.create().initWithObjects(objects);
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
            window.repetition = this; // TODO redact
            Component.didCreate.call(this);

            this.controller = null;
            this.selector = null;

            // The state of the DOM:
            // ---

            // The template that gets repeated in the DOM
            this.iterationTemplate = null;
            // The "iterations" array tracks "visibleObjects".  Each iteration
            // corresponds to a visible object, by its visible position.  An
            // iteration has a template instance
            this.iterations = [];
            // Iteration objects can be reused.  When an iteration is collected,
            // it gets put in the freeIterations list.
            this.freeIterations = []; // push/pop LIFO
            // Iterations that need a template instance:
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

            this.visibleObjects = [];
            // dispatches to this.handleVisibleObjectsRangeChange:
            this.visibleObjects.addRangeChangeListener(this, "visibleObjects");
            // Ascertains that visibleObjects does not get changed by the
            // controller, but the changes are projected on our array.
            this.defineBinding("visibleObjects.*", {
                "<-": "controller.visibleObjects",
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

            // The plan for the next draw to synchronize visibleObjects and
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
            this.canEraseTemplate = false;
            this.templateErased = false;

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
                this._templateId = this.childComponents[0]._suuid || this.childComponents[0].uuid;
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
            // handleVisibleObjectsRangeChange.
            this.createNeededIterations();

            this.canEraseTemplate = true;
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
                serialization.set("ownerComponent", object.ownerComponent, "reference");
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
            this.eventManager.registerEventHandlerForElement(this, iteration.element);
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
                throw new Error("Assertion error: templateDidLoad should only be called after deserializeProperties so there should always be a currentIteration");
            }

            // populate the document fragment for the iteration from the
            // content of the element
            var element = iteration.element;
            var fragment = element.ownerDocument.createDocumentFragment();
            iteration.fragment = fragment;
            while (element.firstChild) {
                var child = element.firstChild;
                element.removeChild(child);
                fragment.appendChild(child);
            }
            this.currentIteration = null;
            // The element property is only necessary to communicate from
            // deserializeIteration to templateDidLoad.
            iteration.element = null;

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

    // Reacting to changes in the controlled visible objects:
    // ----

    // In responses to changes in the controlled visibleObjects array, this
    // method creates a plan to add and delete iterations with their
    // corresponding DOM elements on the next "draw" event.  This may require
    // more iterations to be constructed before the next draw event.
    handleVisibleObjectsRangeChange: {
        value: function (plus, minus, visibleIndex) {

            // add pending operations to run in draw
            for (var offset = 0; offset < minus.length; offset++) {
                var operation = DeleteOperation.create().initWithObjectAndVisibleIndex(
                    minus[offset],
                    visibleIndex
                );
                this.pendingOperations.push(operation);
            }
            for (var offset = 0; offset < plus.length; offset++) {
                var operation = AddOperation.create().initWithObjectAndVisibleIndex(
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
            // TODO figure out whether this is necessary: it should be taken
            // care of by the deserializedFromTemplate method.
            if (!this.iterationTemplate) {
                throw new Error("ASSERTION");
            }
            // Used by Component to determine whether the node of the component
            // object hierarchy is traversable:
            this._isComponentExpanded = true;
            callback();
        }
    },

    // TODO @kriskowal figure out what needs hookup with the canDrawGate and
    // what the heck childComponents is supposed to be at this point.
    canDraw: {
        value: function () {
            // block for the usual component-related issues
            var canDraw = this.canDrawGate.value;
            // block until we have created enough iterations to draw
            canDraw = canDraw && this.neededIterations <= this.createdIterations;
            // block until we can draw initial content if we have not already
            canDraw = canDraw && (this.templateErased || this.canEraseTemplate);
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

            if (!this.templateErased) {
                this.eraseTemplate();
                this.templateErased = true;
            }

            // grow the list of boundaries if necessary
            this.drawBoundaries();

            // execute the pending add and delete operations
            var pendingOperations = this.pendingOperations;
            pendingOperations.forEach(function (operation) {
                operation.execute(this);
            }, this);
            pendingOperations.clear();

        }
    },

    eraseTemplate: {
        value: function () {
            this.element.innerHTML = "";
        }
    },

    drawBoundaries: {
        value: function () {
            for (
                var visibleIndex = this.boundaries.length;
                visibleIndex <= this.neededIterations;
                visibleIndex++
            ) {
                var boundary = document.createComment("");
                this.boundaries.push(boundary);
                this.element.appendChild(boundary);
            }
        }
    },

    cleanupDeletedComponentTree: {
        value: function (pleaseCancelBindings) {
            if (pleaseCancelBindings) {
                this.cancelBindings();
            }
            this.visibleObjects.removeMapChangeListener(this);
            this.visibleObjects.removeBeforeMapChangeListener(this);
            // TODO for each iteration, call cleanupDeletedComponentTree on
            // every component in every iteration.
        }
    },

    // XXX
    //
    // TODO expandComponent isComponentExpanded

});

var Iteration = exports.Iteration = Montage.create(Montage, {

    didCreate: {
        value: function () {
            // A temporary place-holder for the element in the iteration
            // template instantiation process
            this.element = null;
            // An iteration can be "on" or "off" the document.  When the
            // iteration is added to a document, the "fragment" is depopulated
            // and placed between "topBoundary" and "bottomBoundary" on the
            // DOM.  The repetition manages the boundary markers around each
            // visible index.   When all of these are null, the iteration does
            // not yet have a template and has never been placed on the DOM.
            this.fragment = null;
            // The corresponding "object" is tracked in
            // repetition.objectForIteration instead of on the iteration
            // itself.  The bindings in the iteration template react to changes
            // in that map.
            this.childComponents = null;
        }
    },

    injectIntoDocument: {
        value: function (repetition, visibleIndex) {
            var element = repetition.element;
            var bottomBoundary = repetition.boundaries[visibleIndex + 1];
            element.insertBefore(this.fragment, bottomBoundary);
            // notify the components to wake up and smell the document
            for (var i = 0; i < this.childComponents.length; i++) {
                this.childComponents[i].needsDraw = true;
            }
        }
    },

    retractFromDocument: {
        value: function (repetition, visibleIndex) {
            var element = repetition.element;
            var topBoundary = repetition.boundaries[visibleIndex];
            var bottomBoundary = repetition.boundaries[visibleIndex + 1];
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
        }
    }

});

// Operations are tracked in a List of Operations on a Repetition and then
// executed in the "draw" imperative to add and remove Iterations at particular
// positions.
var Operation = exports.Operation = Montage.create(Montage, {

    didCreate: {
        value: function () {
            this.object = null;
            this.visibleIndex = null;
        }
    },

    initWithObjectAndVisibleIndex: {
        value: function (object, visibleIndex) {
            this.object = object;
            this.visibleIndex = visibleIndex;
            return this;
        }
    }

});

var DeleteOperation = exports.AddOperation = Montage.create(Operation, {
    execute: {
        value: function (repetition) {
            // update the model:
            var iteration = repetition.iterations.splice(this.visibleIndex, 1)[0];
            // update the bindings:
            repetition.objectForIteration.set(iteration, null);
            // update the document:
            iteration.retractFromDocument(repetition, this.visibleIndex);
            // recycle the iteration:
            repetition.freeIterations.push(iteration);
        }
    }
});

var AddOperation = exports.AddOperation = Montage.create(Operation, {
    execute: {
        value: function (repetition) {
            // recycle the iteration:
            var iteration = repetition.freeIterations.pop();
            // update the model:
            repetition.iterations.splice(this.visibleIndex, 0, iteration);
            // update the document:
            iteration.injectIntoDocument(repetition, this.visibleIndex);
            // update the bindings:
            repetition.objectForIteration.set(iteration, this.object);
        }
    }
});

var DumbController = exports.DumbController = Montage.create(Montage, {

    selector: {value: null}, // TODO

    start: {value: null}, // TODO

    length: {value: null}, // TODO

    objects: {value: null},

    didCreate: {
        value: function () {
            this.objects = null;
            this.selector = null;
            this.visibleObjects = null;
            this.selection = new Set();
            this.selectedIndexes = new Set();
        }
    },

    initWithObjects: {
        value: function (objects) {
            this.objects = objects;
            this.visibleObjects = objects;
            return this;
        }
    }

    // TODO selectAddedObjects
    // TODO deselectDeletedObjects (always true)
    // TODO deselectInvisibleObjects
    // TODO automaticallyDispatchChangeListener?
    // TODO should a repetition serve as a proxy for the visible objects?
    // TODO canDrawGate.setField("iterationLoaded")
    // TODO account for selection and deselection

});

