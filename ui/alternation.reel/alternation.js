/**
 * @module montage/ui/repetition.reel
 */
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

var Repetition = require("ui/repetition.reel/repetition").Repetition;



exports.Alternation = Repetition.specialize( /** @lends Alternation# */ {
    /**
     * @private
     */
    constructor: {
        value: function Alternation() {
            this.super();

            this.addOwnPropertyChangeListener("switchPath", this);
        }
    },

    handleSwitchPathChange: {
        value: function (newValue, path, myObject) {
            this._switchPathCache = {};
        }
    },

    /**
     * Creates a new iteration and sets up a new instance of the iteration
     * template.  Ensures that only one iteration is being instantiated at a
     * time to guarantee that `currentIteration` can be reliably bound to the
     * particular iteration.
     * @private
     */
    _createIteration: {
        value: function () {
            var self = this,
            iteration;

            iteration = new this.Iteration().initWithRepetition(this);

            this._iterationCreationPromise = this._iterationCreationPromise
            .then(function() {
                var _document = self.element.ownerDocument,
                switchPath,
                instances,
                promise;

                if (self.switchPath) {
                    if (!iteration.object) {
                        console.warn('No iteration.object', iteration.object);
                    }
                    switchPath = iteration.getPath(self.switchPath);
                    self._iterationTemplate = self._getIterationTemplateBySwitchPath(switchPath);
                    self._iterationTemplate.setInstances(self.innerTemplate._instances);
                }

                self.currentIteration = iteration;

                // We need to extend the instances of the template to add the
                // iteration object that is specific to each iteration template
                // instance.
                instances = self._iterationTemplate.getInstances();
                instances = Object.create(instances);
                instances[self._iterationLabel] = iteration;

                promise = self._iterationTemplate.instantiateWithInstances(instances, _document)
                .then(function (part) {
                    part.loadComponentTree().then(function() {
                        iteration._fragment = part.fragment;

                        // It is significant that _childComponents are assigned
                        // *after* the component tree has finished loading
                        // because this signals to the iteration that it should
                        // synchronize the child components with the repetition
                        // based on whether the iteration should be on the DOM
                        // hereafter.
                        iteration._childComponents = part.childComponents;
                        self.constructIteration(iteration);
                    }).done();
                    self.currentIteration = null;
                });

                promise.done(); // radiate an error if necessary
                return promise.then(null, function () {
                    // but regardless of whether this iteration failed, allow
                    // another iteration to be created
                });
            });

            this._requestedIterations++;
            return iteration;
        }
    },

    /**
     * @param {string} switchPath
     * @returns Template
     * @private
     */
    _getIterationTemplateBySwitchPath: {
        value: function(switchPath) {
            if (!this._switchPathCache.hasOwnProperty(switchPath)) {
                var element = this._getTemplateDomArgument(switchPath);
                if (!element) {
                    throw new Error("Cannot find " + JSON.stringify(switchPath)); // TODO: better error message
                }
                this._switchPathCache[switchPath] = this.innerTemplate.createTemplateFromDomElement(element)
            }

            return this._switchPathCache[switchPath];
        }
    },

    /**
     * @type {Object.<string, Template>}
     * @private
     */
    _switchPathCache: {value: {}}

});
