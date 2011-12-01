/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/data/selector
    @requires montage/core/core
    @requires montage/data/controllistener
    @requires montage/data/pledge
    @requires montage/core/exception
    @requires montage/core/shim/structures
    @requires montage/core/promise
    @requires montage/core/logger
*/
var Montage = require("montage").Montage;
var ControlListener = require("data/controllistener").ControlListener;
var Pledge = require("data/pledge").Pledge;
var PledgedArray = require("data/pledge").PledgedArray;
var Exception = require("core/exception").Exception;
var Map = require("core/shim/structures").Map;
var Set = require("core/shim/structures").Set;
var OrderedSet = require("core/shim/structures").OrderedSet;
var Q = require("core/promise");
var logger = require("core/logger").logger("selector");
/**
    @class module:montage/data/selector.SelectorRegistry
    @classdesc The selector registry provides a documented way to extend the list of selectors.<br>
    By default, selector should provide an in-memory evaluator.
    @extends module:montage/core/core.Montage
*/

var _selectorRegistry = null;
var SelectorRegistry = exports.SelectorRegistry = Montage.create(Montage,/** @lends module:montage/data/selector.SelectorRegistry# */ {

    _selectorTable: {
        value: new Map(),
        writable: false,
        serializable: true,
        distinct: true,
        enumerable: false
    },
/**
  Description TODO
  @private
*/
    _evaluatorTable: {
        value: new Map(),
        writable: false,
        serializable: true,
        distinct: true,
        enumerable: false
    },
/**
    Description TODO
    @function
    @returns itself
    */
    init: {
        serializable: false,
        enumerable: false,
        value: function() {
            // Patch the collections to accept filterWithSelector
            Selector._patchCollections();
            return this;
        }
    },

    /*
     *
     */
/**
    Register a new selector.<br>
    This method creates a new property on the Selector prototype for each of the names returned by the aliases method of the selector being registered.
    @function
    @param {Prototype} selector The selector prototype.
    @returns {Prototype} selector
    */
    registerSelector: {
        value: function(selector) {
            if ((selector != null) && (typeof selector.evaluate === 'function') && (typeof selector.aliases != null)) {
                if (typeof selector.aliases === 'string') {
                    this.__registerSelector(selector.aliases, selector);
                } else if (Selector.isArray(selector.aliases)) {
                    var alias, index;
                    var aliases = selector.aliases;
                    for (index = 0; typeof (alias = aliases[index]) !== "undefined"; index++) {
                        this.__registerSelector(alias, selector);
                    }
                }
            }
            return selector;
        }
    },

/**
  Description TODO
  @private
*/
    __registerSelector: {
        enumerable: false,
        value: function(alias, selector) {
            var operatorDefinition;
            if (this.selectorForKey(alias) === null) {
                operatorDefinition = {
                    value: function() {
                        var newSelector = selector.create();
                        return newSelector.initWithSelector.call(newSelector, this, Array.prototype.slice.call(arguments));
                    },
                    enumerable: true,
                    serializable: false
                }
                Montage.defineProperty(Selector, alias, operatorDefinition);
                //
                // We need to check the evaluator has the visitor methods for custom selectors
                this._evaluatorTable.forEach(function(evaluator, key) {
                    if (typeof evaluator[selector.visitorMethodName] === 'undefined') {
                        var method = selector.visitorMethodForEvaluatorID(evaluator.evaluatorId);
                        if (typeof method === 'function') {
                            Object.defineProperty(evaluator, selector.visitorMethodName, method);
                        }
                    }
                });
                //
                this._selectorTable.set(alias, selector);
            } else {
                throw Exception.create().initWithMessageTargetAndMethod("Selector already defined", selector, alias);
            }
        }
    },
/**
    Description TODO
    @function
    @param {String} key TODO
    @returns {Selector} type
    */
    selectorForKey: {
        value: function(key) {
            var selector = this._selectorTable.get(key);
            return (typeof selector !== 'undefined' ? selector : null);
        }
    },

    /*
     * Remove a previously registered selector
     */
 /**
    Remove a previously registered selector.
    @function
    @param {Prototype} selector To be deregistered.
    @returns selector
    */
    deregisterSelector: {
        value: function(selector) {
            if ((selector == null) || (typeof selector.aliases == null)) {
                return null;
            }
            if (typeof selector.aliases === 'string') {
                this.__deregisterSelector(selector.aliases, selector);
            } else if (Selector.isArray(selector.aliases)) {
                var alias, index;
                var aliases = selector.aliases;
                for (index = 0; typeof (alias = aliases[index]) !== "undefined"; index++) {
                    this.__deregisterSelector(alias, selector);
                }
            }
            return selector;
        }
    },

/**
  Description TODO
  @private
*/
    __deregisterSelector: {
        enumerable: false,
        value: function(alias, selector) {
            // TODO [PJYF Aug 31 2011] Needs to be remove the property but I am not sure how.
            this._selectorTable.delete(alias);
        }
    },
/**
    Description TODO
    @function
    @param {Prototype} evaluator To be registered.
    @returns evaluator
    */
    registerEvaluator: {
        value: function(evaluator) {
            this._evaluatorTable.set(evaluator.evaluatorId, evaluator);
            // We need to check the evaluator has the visitor methods for custom selectors
            this._selectorTable.forEach(function(selector, key) {
                if (typeof evaluator[selector.visitorMethodName] === 'undefined') {
                    var method = selector.visitorMethodForEvaluatorID(evaluator.evaluatorId);
                    if (typeof method === 'function') {
                        Object.defineProperty(evaluator, selector.visitorMethodName, method);
                    }
                }
            });
            return evaluator;
        }
    },
/**
    Description TODO
    @function
    @returns evaluatorIds
    */
    evaluatorIds: {
        get: function() {
            var evaluatorIds = new Array();
            this._evaluatorTable.forEach(function(element, key) {
                evaluatorIds.push(key);
            });
            return evaluatorIds;
        }
    },
/**
    Description TODO
    @function
    @param {String} evaluatorId The evaluator id
    @returns value
    */
    evaluatorForId: {
        value: function(evaluatorId) {
            var value = this._evaluatorTable.get(evaluatorId);
            if (typeof value === 'undefined') {
                return null;
            }
            return value;
        }
    },
/**
    Description TODO
    @function
    @param {Prototype} evaluator The evaluator to be deregistered.
    @returns evaluator
    */
    deregisterEvaluator: {
        value: function(evaluator) {
            this._evaluatorTable.delete(evaluator.evaluatorId);
            return evaluator;
        }
    }

});

/*
 * Selectors are used to limit the array of objects return by a query. They are expressed by chaining a list of selectors on the class.
 *
 * They can be constructed by chaining selectors:
 * <code>
 *
 * </code>
 *
 * It is possible to define custom selectors for specific usage. A custom selector needs to implement 3 methods:
 * aliases, visitorMethodName and visitorMethodForEvaluatorID.
 *
 * aliases return a string or an array of string that will be added to the vocabulary of selectors.
 * visitorMethodName is the name of the method to call on the evaluator to visit the selector.
 * visitorMethodForEvaluatorID should return a function appropriate for the evaluator type to visit that selector.
 *
 */
/**
    @class module:montage/data/selector.Selector
*/
var Selector = exports.Selector = Montage.create(Montage,/** @lends module:montage/data/selector.Selector# */ {
/**
        Description TODO
        @type {String}
        @default null
    */
    leftHand: {
        enumerable: true,
        serializable: true,
        value: null
    },

    /*
     * Returns the selector registry. The selector registry is a unique object in charge of registering selectors to use in memory or in access modules.
     */
/**
    Returns the selector registry.<br>
    The selector registry is a unique object in charge of registering selectors to use in memory or in access modules.
    @function
    @returns  _selectorRegistry
    */
   registry: {
        get: function() {
            if (_selectorRegistry === null) {
                _selectorRegistry = SelectorRegistry.create().init();
            }
            return _selectorRegistry;
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The object
    @param {Function} declaredArguments TODO
    @returns itself
    */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            this.leftHand = selector;
            return this;
        }
    },

 /**
    Returns the result of the evaluation of this selector with the object.
    @function
    @param {Object} object The object being evaluated; input object on which in memory evaluation will be performed.
    @param {Parameters} parameters The evaluation measures.
    @returns The result of the selector evaluation.
    */
    evaluate: {
        value: function(object, parameters) {
            return this.accept(InMemorySelectorEvaluator.create().initWithTargetAndParameters(object, parameters));
        }
    },

 /**
    Filters the array passed on argument by applying the selector to each element of the array and returning a new array.
    @function
    @param {Array} array The array passed on argument.
    @param {Parameter} parameters Measures applied to each element.
    @returns results
    */
    filterArray: {
        value: function(array, parameters) {
            if (!this.isArray(array) || (array.length === 0)) {
                return Q.ref(array);
            }

            // First we need a clone of the array object to store the results.
            var results = Montage.create(Object.getPrototypeOf(array), {});
            if (Pledge.isPledge(array)) {
                // TODO [PJYF Sept 22 2011] we need to resolve the pledged array.
                throw Exception.initWithMessageTargetAndMethod("filter by selector does not currently support array faults.", array, "filterArray");
            }

            // this promise will be rejected when the *first* selector is rejected
            // or fulfilled with the results array when *all* selectors are fulfilled
            var result = Q.defer();
            var self = this;

            var allSelectorsDone = array.reduce(function(previousSelectorDone, element) {
                // get all selector evaluation running in parallel

                var include = self.accept(InMemorySelectorEvaluator.create().initWithTargetAndParameters(element, parameters));
                return Q.when(include, function (include) {
                    return Q.when(previousSelectorDone, function () {
                        if (include) {
                            results.add(element);
                        }
                    });
                }, function(reason, error) {
                    result.reject(reason, error);
                });
                // the initial value of "previousSelectorDone" is a fulfilled promise for undefined:
            }, undefined);

            Q.when(allSelectorsDone, function () {
                result.resolve(results);
            });

            return Q.when(result.promise, function () {
                return results;
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} evaluator The acceptance evaluator.
    @returns Q.ref(null)
    */
    accept: {
        value: function(evaluator) {
            var visitorMethod = evaluator[this.visitorMethodName];
            if (typeof visitorMethod === 'function') {
                return visitorMethod.call(evaluator, this);
            } else {
                logger.error("The visitor does not implement the method for the selector: " + this.visitorMethodName);
            }
            return Q.ref(null);
        }
    },

/**
        Aliases are elements of the selector vocabulary.<br>
        The property can return a string or an array of strings.
        @type {Property}
        @default null
    */
    aliases: {
        value: null,
        writable: false
    },

/**
        Returns the name of the method called by the accept method.
        @type {String}
        @default "visit"
    */
    visitorMethodName: {
        value: "visit",
        writable: false
    },

/**
    This should return the evaluator method for the target selector and the type of evaluator.<br>
    The visitor method should take the selector as parameter and return a promise result of the visit.
    @function
    @param {String} evaluatorID The evaluator id.
    @returns method
    */
    visitorMethodForEvaluatorID: {
        value: function(evaluatorID) {
            // This is a token do nothing method.
            var method = function(selector) {
                return Q.ref(null);
            };
            return method;
        }
    },

/**
    This is a convenience function to enable the redefinition of what an array is.
    @function
    @param {Object} object The object to be redefined.
    @returns {Boolean} false
    */
    isArray: {
        value: function(object) {
            if (object == null) {
                return false;
            }
            if (Array.isArray(object)) {
                return true;
            }
            var collectionPrototype, index;
            for (index = 0; typeof (collectionPrototype = Selector.__collectionsPrototypesToPatch[index]) !== "undefined"; index++) {
                if (object.prototype === collectionPrototype) {
                    return true;
                }
            }
            return false;
        }
    },
/**
    Definition TODO
    @function
    @param {Object} object The object to be selected.
    @returns object
    */
    isSelector: {
        value: function(object) {
            if (object == null) {
                return false;
            }
            return  (typeof object == 'object') && Object.getPrototypeOf(object)["isSelector"];
        }
    },
/**
  Description TODO
  @private
*/
    __collectionsPrototypesToPatch: {
        enumerable: false,
        serializable: false,
        writable: false,
        value: [Array.prototype, Set, OrderedSet]
    },
/**
  Description TODO
  @private
*/
    _patchCollections: {
        value: function() {
            var filterWithSelector, collectionPrototype, index;
            filterWithSelector = {
                enumerable: false,
                serializable: false,
                value: function(selector) {
                    if (Selector.isSelector(selector)) {
                        return selector.filterArray(this);
                    }
                    return this;
                }
            }
            for (index = 0; typeof (collectionPrototype = Selector.__collectionsPrototypesToPatch[index]) !== "undefined"; index++) {
                Object.defineProperty(collectionPrototype, "filterWithSelector", filterWithSelector);
            }
            // we also need to fix the Array that don't support the add.
            if (!Array.prototype.add) {
                Object.defineProperty(Array.prototype, "add", {
                    enumerable: false,
                    serializable: false,
                    value: function(element) {
                        this.push(element);
                    }
                });
            }
        }
    }

})

/**
    @class module:montage/data/selector.SelectorEvaluator
    @classdesc Selector evaluator uses a visitor pattern.
*/
var SelectorEvaluator = exports.SelectorEvaluator = Montage.create(Montage,/** @lends module:montage/data/selector.SelectorEvaluator# */ {
/**
        Description TODO
        @type {Property}
        @default null
    */
    target: {
        enumerable: true,
        serializable: true,
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {String} null
    */
    parameters: {
        enumerable: true,
        serializable: true,
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {String} "evaluator"
    */
    evaluatorId: {
        enumerable: true,
        serializable: true,
        value: "evaluator"
    },

 /**
    Create a new evaluator.
    @function
    @param {Object} target Object target of the selector.
    @param {Value} parameters Values for selector parameters.
    @returns itself
*/
    initWithTargetAndParameters: {
        value: function(targetObject, parameters) {
            this.target = targetObject;
            Object.defineProperty(this, "target", {writable: false});
            this.parameters = (parameters != null ? parameters : {});
            Object.defineProperty(this, "parameters", {writable: false});
            return this;
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Boolean} Q.ref(false)
    */
    visit: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(false);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitProperty: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Boolean} Q.ref(true)
    */
    visitTrue: {
        value: function(selector) {
            return Q.ref(true);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Boolean} Q.ref(false)
    */
    visitFalse: {
        value: function(selector) {
            return Q.ref(false);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(value)
    */
    visitParameter: {
        value: function(selector) {
            var value = this.parameters[selector.propertyPath];
            if (typeof value === 'undefined') {
                value = null;
            }
            return Q.ref(value);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitEqualComparison: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitNotEqualComparison: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitLessComparison: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitLessOrEqualComparison: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitGreaterComparison: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitGreaterOrEqualComparison: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitAndBoolean: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitOrBoolean: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitXorBoolean: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitNotBoolean: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitContainsString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitCaseInsensitiveContainsString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitLikeString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitCaseInsensitiveLikeString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitStartsWithString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitCaseInsensitiveStartsWithString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitEndsWithString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitCaseInsensitiveEndsWithString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitFilterArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitFilteredArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitFirstArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitLastArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitOneArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitRequiredOneArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    }

})
/**
    @class module:montage/data/selector.InMemorySelectorEvaluator
*/
var InMemorySelectorEvaluator = exports.InMemorySelectorEvaluator = Montage.create(SelectorEvaluator,/** @lends module:montage/data/selector.InMemorySelectorEvaluator# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "inMemory"
    */
    evaluatorId: {
        enumerable: true,
        serializable: true,
        value: "inMemory"
    },
/**
  Description TODO
  @private
*/
    _leftHand: {
        enumerable: false,
        serializable: false,
        value: function(selector) {
            var left = selector.leftHand;
            if (left) {
                left = this.target;
            } else if (Selector.isSelector(left)) {
                left = selector.leftHand.accept(selector);
            }
            return left;
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(target.getProperty(selector.propertyPath))
    */
    visitProperty: {
        value: function(selector) {
            var target = this.target,
                res, propPath = selector.propertyPath;
            if (Selector.isArray(target)) {
                res = [];
                target.forEach(function(object, index) {
                    res[index] = object.getProperty(propPath);
                });
                return Q.ref(res);
            }
            return Q.ref(target.getProperty(selector.propertyPath));
        }
    },

/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0] == values[1])
    */
    visitEqualComparison: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.rightHand == null;
            }
            var right = Selector.isSelector(selector.rightHand) ? selector.rightHand.accept(selector) : selector.rightHand;
            return Q.all([this._leftHand(selector), right]).then(function(values) {
                return Q.ref(values[0] == values[1]);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0] != values[1])
    */
    visitNotEqualComparison: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.rightHand == null;
            }
            var right = Selector.isSelector(selector.rightHand) ? selector.rightHand.accept(selector) : selector.rightHand;
            return Q.all([this._leftHand(selector), right]).then(function(values) {
                return Q.ref(values[0] != values[1]);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0] < values[1])
    */
    visitLessComparison: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.rightHand == null;
            }
            var right = Selector.isSelector(selector.rightHand) ? selector.rightHand.accept(selector) : selector.rightHand;
            return Q.all([this._leftHand(selector), right]).then(function(values) {
                return Q.ref(values[0] < values[1]);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0] <= values[1])
    */
    visitLessOrEqualComparison: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.rightHand == null;
            }
            var right = Selector.isSelector(selector.rightHand) ? selector.rightHand.accept(selector) : selector.rightHand;
            return Q.all([this._leftHand(selector), right]).then(function(values) {
                return Q.ref(values[0] <= values[1]);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0] > values[1])
    */
    visitGreaterComparison: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.rightHand == null;
            }
            var right = Selector.isSelector(selector.rightHand) ? selector.rightHand.accept(selector) : selector.rightHand;
            return Q.all([this._leftHand(selector), right]).then(function(values) {
                return Q.ref(values[0] > values[1]);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0] >= values[1])
    */
    visitGreaterOrEqualComparison: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.rightHand == null;
            }
            var right = Selector.isSelector(selector.rightHand) ? selector.rightHand.accept(selector) : selector.rightHand;
            return Q.all([this._leftHand(selector), right]).then(function(values) {
                return Q.ref(values[0] >= values[1]);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(result)
    */
    visitAndBoolean: {
        value: function(selector) {
            var promises = new Array(selector.rightHandSelectors.length + 1);
            promises[0] = this._leftHand(selector);
            var item, index;
            for (index = 0; typeof (item = selector.rightHandSelectors[index]) !== "undefined"; index++) {
                promises[index] = Selector.isSelector(item.leftHand) ? item.leftHand.accept(selector) : item.leftHand;
            }
            var result = true;
            return Q.all(promises).then(function(values) {
                for (index = 0; typeof (item = values[index]) !== "undefined"; index++) {
                    result = result & values[index];
                }
                return Q.ref(result);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(result)
    */
    visitOrBoolean: {
        value: function(selector) {
            var promises = new Array(selector.rightHandSelectors.length + 1);
            promises[0] = this._leftHand(selector);
            var item, index;
            for (index = 0; typeof (item = selector.rightHandSelectors[index]) !== "undefined"; index++) {
                promises[index] = Selector.isSelector(item.leftHand) ? item.leftHand.accept(selector) : item.leftHand;
            }
            var result = false;
            return Q.all(promises).then(function(values) {
                for (index = 0; typeof (item = values[index]) !== "undefined"; index++) {
                    result = result | values[index];
                }
                return Q.ref(result);
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitXorBoolean: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitNotBoolean: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0].match(values[1]))
    */
    visitContainsString: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.stringFragment == null;
            }
            var fragment = Selector.isSelector(selector.stringFragment) ? selector.stringFragment.accept(selector) : selector.stringFragment;
            return Q.all([this._leftHand(selector), fragment]).then(function(values) {
                /* Returns an array of all matches in the string*/
                return Q.ref(values[0].match(values[1]));
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0].toLowerCase().match(values[1].toLowerCase()))
    */
    visitCaseInsensitiveContainsString: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.stringFragment == null;
            }
            var fragment = Selector.isSelector(selector.stringFragment) ? selector.stringFragment.accept(selector) : selector.stringFragment;
            return Q.all([this._leftHand(selector), fragment]).then(function(values) {
                return Q.ref(values[0].toLowerCase().match(values[1].toLowerCase()));
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitLikeString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitCaseInsensitiveLikeString: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0].match("^"+values[1]))
    */
    visitStartsWithString: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.stringFragment == null;
            }
            var fragment = Selector.isSelector(selector.stringFragment) ? selector.stringFragment.accept(selector) : selector.stringFragment;
            return Q.all([this._leftHand(selector), fragment]).then(function(values) {
                return Q.ref(values[0].match("^"+values[1]));
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0].toLowerCase().match("^"+values[1].toLowerCase()))
    */
    visitCaseInsensitiveStartsWithString: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.stringFragment == null;
            }
            var fragment = Selector.isSelector(selector.stringFragment) ? selector.stringFragment.accept(selector) : selector.stringFragment;
            return Q.all([this._leftHand(selector), fragment]).then(function(values) {
                return Q.ref(values[0].toLowerCase().match("^"+values[1].toLowerCase()));
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0].match(values[1]+"$"))
    */
    visitEndsWithString: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.stringFragment == null;
            }
            var fragment = Selector.isSelector(selector.stringFragment) ? selector.stringFragment.accept(selector) : selector.stringFragment;
            return Q.all([this._leftHand(selector), fragment]).then(function(values) {
                return Q.ref(values[0].match(values[1]+"$"));
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns {Array} Q.ref(values[0].toLowerCase().match(values[1].toLowerCase()+"$"))
    */
    visitCaseInsensitiveEndsWithString: {
        value: function(selector) {
            if (selector.leftHand == null) {
                return selector.stringFragment == null;
            }
            var fragment = Selector.isSelector(selector.stringFragment) ? selector.stringFragment.accept(selector) : selector.stringFragment;
            return Q.all([this._leftHand(selector), fragment]).then(function(values) {
                return Q.ref(values[0].toLowerCase().match(values[1].toLowerCase()+"$"));
            });
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitFilterArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitFilteredArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitFirstArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitLastArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitOneArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    },
/**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @returns Q.ref(null)
    */
    visitRequiredOneArray: {
        value: function(selector) {
            // Placeholder.
            return Q.ref(null);
        }
    }

})

Selector.registry.registerEvaluator(InMemorySelectorEvaluator);
/**
    @class module:montage/data/selector.Property
*/
var Property = exports.Property = Montage.create(Selector,/** @lends module:montage/data/selector.Property# */ {
/**
        Description TODO
        @type {Property}
        @default {Function} null
    */
    propertyPath: {
        enumerable: true,
        serializable: true,
        value: null
    },

 /**
    Description TODO
    @function
    @param {Object} selector The selector object.
    @param {Function} declaredArguments Declared arguments for initialization.
    @returns itself
    */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            var self = Selector.initWithSelector.call(this, selector, declaredArguments);
            self.propertyPath = (declaredArguments.length > 0 ? declaredArguments[0] : "");
            return self;
        }
    },
/**
        Description TODO
        @type {Property}
        @default {Array} ["property", "where"]
    */
    aliases: {
        value: ["property", "where"],
        writable: false
    },
/**
        Description TODO
        @type {Property}
        @default {String} "visitProperty"
    */
    visitorMethodName: {
        value: "visitProperty",
        writable: false
    }

});
Selector.registry.registerSelector(Property);
/**
    @class module:montage/data/selector.TRUE
*/
var TRUE = Object.freeze(Montage.create(Property,/** @lends module:montage/data/selector.TRUE# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["true", "yes"]
    */
    aliases: {
        value: ["true", "yes"],
        writable: false
    },
/**
        Description TODO
        @type {Property}
        @default {String} "visitTrue"
    */
    visitorMethodName: {
        value: "visitTrue",
        writable: false
    }

}));
Selector.registry.registerSelector(TRUE);
/**
    @class module:montage/data/selector.FALSE
*/
var FALSE = Object.freeze(Montage.create(Property,/** @lends module:montage/data/selector.FALSE# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["false", "no"]
    */
    aliases: {
        value: ["false", "no"],
        writable: false
    },
/**
        Description TODO
        @type {Property}
        @default {String} "visitFalse"
    */
    visitorMethodName: {
        value: "visitFalse",
        writable: false
    }

}));
Selector.registry.registerSelector(FALSE);
/**
    @class module:montage/data/selector.SelectorParameter
*/
var SelectorParameter = exports.SelectorParameter = Montage.create(Selector,/** @lends module:montage/data/selector.SelectorParameter# */ {
/**
        Description TODO
        @type {Property}
        @default {Function} null
    */
    propertyPath: {
        enumerable: true,
        serializable: true,
        value: null
    },

 /**
    Description TODO
    @function
    @param {Object} selector The object
    @param {Function} declaredArguments TODO
    @returns itself
    */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            var self = Selector.initWithSelector.call(this, selector, declaredArguments);
            self.propertyPath = (declaredArguments.length > 0 ? declaredArguments[0] : "");
            return self;
        }
    },
/**
        Description TODO
        @type {Property}
        @default {Array} ["parameter", "param"]
    */
    aliases: {
        value: ["parameter", "param"],
        writable: false
    },
/**
        Description TODO
        @type {Property}
        @default {String} "visitParameter"
    */
    visitorMethodName: {
        value: "visitParameter",
        writable: false
    }

});
Selector.registry.registerSelector(SelectorParameter);
/**
    @class module:montage/data/selector.ComparisonSelector
    @classdesc The Comparison Selector
*/
var ComparisonSelector = exports.ComparisonSelector = Montage.create(Selector,/** @lends module:montage/data/selector.ComparisonSelector# */ {
/**
        Description TODO
        @type {Property}
        @default null
    */
    rightHand: {
        enumerable: true,
        serializable: true,
        value: null
    },
    /*
     * Constructor
     * The expressions can either be a constant value a Property object or another selector.
     * The key is evaluated on the target object before the selector is evaluated.
     *  @param leftHandExpression
     *  @param rightHandExpression
     *  @constructor
     */
/**
    Description TODO
    @function
    @param {Object} selector The object
    @param {Function} declaredArguments TODO
    @returns itself
    */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            var self = Selector.initWithSelector.call(this, selector, declaredArguments);
            self.rightHand = (declaredArguments.length > 0 ? declaredArguments[0] : null);
            return self;
        }
    }

});
/**
    @class module:montage/data/selector.EqualComparisonSelector
*/
var EqualComparisonSelector = exports.EqualComparisonSelector = Montage.create(ComparisonSelector,/** @lends module:montage/data/selector.EqualComparisonSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["eq", "equal"]
    */
    aliases: {
        value: ["eq", "equal"],
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitEqualComparison"
    */
    visitorMethodName: {
        value: "visitEqualComparison",
        writable: false
    }

});
Selector.registry.registerSelector(EqualComparisonSelector);
/**
    @class module:montage/data/selector.NotEqualComparisonSelector
*/
var NotEqualComparisonSelector = exports.NotEqualComparisonSelector = Montage.create(ComparisonSelector,/** @lends module:montage/data/selector.NotEqualComparisonSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["ne", "notEqual"]
    */
    aliases: {
        value: ["ne", "notEqual"],
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitNotEqualComparison"
    */
    visitorMethodName: {
        value: "visitNotEqualComparison",
        writable: false
    }

});
Selector.registry.registerSelector(NotEqualComparisonSelector);
/**
    @class module:montage/data/selector.LessComparisonSelector
*/
var LessComparisonSelector = exports.LessComparisonSelector = Montage.create(ComparisonSelector,/** @lends module:montage/data/selector.LessComparisonSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["lt", "less"]
    */
    aliases: {
        value: ["lt", "less"],
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitLessComparison"
    */
    visitorMethodName: {
        value: "visitLessComparison",
        writable: false
    }

});
Selector.registry.registerSelector(LessComparisonSelector);
/**
    @class module:montage/data/selector.LessOrEqualComparisonSelector
*/
var LessOrEqualComparisonSelector = exports.LessOrEqualComparisonSelector = Montage.create(ComparisonSelector,/** @lends module:montage/data/selector.LessOrEqualComparisonSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["le", "lessOrEqual"]
    */
    aliases: {
        value: ["le", "lessOrEqual"],
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitLessOrEqualComparison"
    */
    visitorMethodName: {
        value: "visitLessOrEqualComparison",
        writable: false
    }

});
Selector.registry.registerSelector(LessOrEqualComparisonSelector);
/**
    @class module:montage/data/selector.GreaterComparisonSelector
*/
var GreaterComparisonSelector = exports.GreaterComparisonSelector = Montage.create(ComparisonSelector,/** @lends module:montage/data/selector.GreaterComparisonSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["gt", "greater"]
    */
    aliases: {
        value: ["gt", "greater"],
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitGreaterComparison"
    */
    visitorMethodName: {
        value: "visitGreaterComparison",
        writable: false
    }

});
Selector.registry.registerSelector(GreaterComparisonSelector);
/**
    @class module:montage/data/selector.GreaterOrEqualComparisonSelector
*/
var GreaterOrEqualComparisonSelector = exports.GreaterOrEqualComparisonSelector = Montage.create(ComparisonSelector,/** @lends module:montage/data/selector.GreaterOrEqualComparisonSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Array} ["ge", "greaterOrEqual"]
    */
    aliases: {
        value: ["ge", "greaterOrEqual"],
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitGreaterOrEqualComparison"
    */
    visitorMethodName: {
        value: "visitGreaterOrEqualComparison",
        writable: false
    }

});
Selector.registry.registerSelector(GreaterOrEqualComparisonSelector);

/**
    @class module:montage/data/selector.BooleanSelector
    @classdesc The Boolean Selector
*/
var BooleanSelector = exports.BooleanSelector = Montage.create(Selector,/** @lends module:montage/data/selector.BooleanSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Function} null
    */
    rightHandSelectors: {
        enumerable: true,
        serializable: true,
        value: null
    },
/**
    Description TODO
    @function
    @param {Object} selector The object
    @param {Function} declaredArguments TODO
    @returns itself
    */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            var self = Selector.initWithSelector.call(this, selector, declaredArguments);
            self.rightHandSelectors = Array.prototype.slice.call(declaredArguments);
            return self;
        }
    }

});
/**
    @class module:montage/data/selector.AndBooleanSelector
*/
var AndBooleanSelector = exports.AndBooleanSelector = Montage.create(BooleanSelector,/** @lends module:montage/data/selector.AndBooleanSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "and"
    */
    aliases: {
        value: "and",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitAndBoolean"
    */
    visitorMethodName: {
        value: "visitAndBoolean",
        writable: false
    }

});
Selector.registry.registerSelector(AndBooleanSelector);
/**
    @class module:montage/data/selector.OrBooleanSelector
*/
var OrBooleanSelector = exports.OrBooleanSelector = Montage.create(BooleanSelector,/** @lends module:montage/data/selector.OrBooleanSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "or"
    */
    aliases: {
        value: "or",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitOrBoolean"
    */
    visitorMethodName: {
        value: "visitOrBoolean",
        writable: false
    }

});
Selector.registry.registerSelector(OrBooleanSelector);
/**
    @class module:montage/data/selector.XorBooleanSelector
*/
var XorBooleanSelector = exports.XorBooleanSelector = Montage.create(BooleanSelector,/** @lends module:montage/data/selector.XorBooleanSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "xor"
    */
    aliases: {
        value: "xor",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitXorBoolean"
    */
    visitorMethodName: {
        value: "visitXorBoolean",
        writable: false
    }

});
Selector.registry.registerSelector(XorBooleanSelector);
/**
    @class module:montage/data/selector.NotBooleanSelector
*/
var NotBooleanSelector = exports.NotBooleanSelector = Montage.create(BooleanSelector,/** @lends module:montage/data/selector.NotBooleanSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "not"
    */
    aliases: {
        value: "not",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitNotBoolean"
    */
    visitorMethodName: {
        value: "visitNotBoolean",
        writable: false
    }

});
Selector.registry.registerSelector(NotBooleanSelector);
/**
    @class module:montage/data/selector.StringSelector
    @classdesc The String Selector
*/
var StringSelector = exports.StringSelector = Montage.create(Selector,/** @lends module:montage/data/selector.StringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {Function} null
    */
    stringFragment: {
        enumerable: true,
        serializable: true,
        value: null
    },
/**
    Description TODO
    @function
    @param {Object} selector The object
    @param {Function} declaredArguments TODO
    @returns itself
    */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            var self = Selector.initWithSelector.call(this, selector, declaredArguments);
            self.stringFragment = (declaredArguments.length > 0 ? declaredArguments[0] : "");
            return self;
        }
    }

});
/**
    @class module:montage/data/selector.ContainsStringSelector
*/
var ContainsStringSelector = exports.ContainsStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.ContainsStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "contains"
    */
    aliases: {
        value: "contains",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitContainsString"
    */
    visitorMethodName: {
        value: "visitContainsString",
        writable: false
    }

});
Selector.registry.registerSelector(ContainsStringSelector);
/**
    @class module:montage/data/selector.CaseInsensitiveContainsStringSelector
*/
var CaseInsensitiveContainsStringSelector = exports.CaseInsensitiveContainsStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.CaseInsensitiveContainsStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "caseInsensitiveContains"
    */
    aliases: {
        value: "caseInsensitiveContains",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitCaseInsensitiveContainsString"
    */
    visitorMethodName: {
        value: "visitCaseInsensitiveContainsString",
        writable: false
    }

});
Selector.registry.registerSelector(CaseInsensitiveContainsStringSelector);
/**
    @class module:montage/data/selector.LikeStringSelector
*/
var LikeStringSelector = exports.LikeStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.LikeStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "like"
    */
    aliases: {
        value: "like",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitLikeString"
    */
    visitorMethodName: {
        value: "visitLikeString",
        writable: false
    }

});
Selector.registry.registerSelector(LikeStringSelector);
/**
    @class module:montage/data/selector.CaseInsensitiveLikeStringSelector
*/
var CaseInsensitiveLikeStringSelector = exports.CaseInsensitiveLikeStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.CaseInsensitiveLikeStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "caseInsensitiveLike"
    */
    aliases: {
        value: "caseInsensitiveLike",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitCaseInsensitiveLikeString"
    */
    visitorMethodName: {
        value: "visitCaseInsensitiveLikeString",
        writable: false
    }

});
Selector.registry.registerSelector(CaseInsensitiveLikeStringSelector);
/**
    @class module:montage/data/selector.StartsWithStringSelector
*/
var StartsWithStringSelector = exports.StartsWithStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.StartsWithStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "startsWith"
    */
    aliases: {
        value: "startsWith",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitStartsWithString"
    */
    visitorMethodName: {
        value: "visitStartsWithString",
        writable: false
    }

});
Selector.registry.registerSelector(StartsWithStringSelector);
/**
    @class module:montage/data/selector.CaseInsensitiveStartsWithStringSelector
*/
var CaseInsensitiveStartsWithStringSelector = exports.CaseInsensitiveStartsWithStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.CaseInsensitiveStartsWithStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "caseInsensitiveStartsWith"
    */
    aliases: {
        value: "caseInsensitiveStartsWith",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitCaseInsensitiveStartsWithString"
    */
    visitorMethodName: {
        value: "visitCaseInsensitiveStartsWithString",
        writable: false
    }

});
Selector.registry.registerSelector(CaseInsensitiveStartsWithStringSelector);
/**
    @class module:montage/data/selector.EndsWithStringSelector
*/
var EndsWithStringSelector = exports.EndsWithStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.EndsWithStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "endsWith"
    */
    aliases: {
        value: "endsWith",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitEndsWithString"
    */
    visitorMethodName: {
        value: "visitEndsWithString",
        writable: false
    }

});
Selector.registry.registerSelector(EndsWithStringSelector);
/**
    @class module:montage/data/selector.CaseInsensitiveEndsWithStringSelector
*/
var CaseInsensitiveEndsWithStringSelector = exports.CaseInsensitiveEndsWithStringSelector = Montage.create(StringSelector,/** @lends module:montage/data/selector.CaseInsensitiveEndsWithStringSelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "caseInsensitiveEndsWith"
    */
    aliases: {
        value: "caseInsensitiveEndsWith",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitCaseInsensitiveEndsWithString"
    */
    visitorMethodName: {
        value: "visitCaseInsensitiveEndsWithString",
        writable: false
    }

});

Selector.registry.registerSelector(CaseInsensitiveEndsWithStringSelector);
/**
    @class module:montage/data/selector.ArraySelector
    @classdesc The Array Selector
*/
var ArraySelector = exports.ArraySelector = Montage.create(Selector,/** @lends module:montage/data/selector.ArraySelector# */ {
/**
    Description TODO
    @function
    @param {Object} selector The object
    @param {Function} declaredArguments TODO
    @returns itself
    */
    initWithSelector: {
        enumerable: false,
        value: function(selector, declaredArguments) {
            var self = Selector.initWithSelector.call(this, selector, declaredArguments);
            self.parameters = declaredArguments;
            return self;
        }
    }

});
/**
    @class module:montage/data/selector.FilterArraySelector
*/
var FilterArraySelector = exports.FilterArraySelector = Montage.create(ArraySelector,/** @lends module:montage/data/selector.FilterArraySelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "filter"
    */
    aliases: {
        value: "filter",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitFilterArray"
    */
    visitorMethodName: {
        value: "visitFilterArray",
        writable: false
    }

});
Selector.registry.registerSelector(FilterArraySelector);
/**
    @class module:montage/data/selector.FilteredArraySelector
*/
var FilteredArraySelector = exports.FilteredArraySelector = Montage.create(ArraySelector,/** @lends module:montage/data/selector.FilteredArraySelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "filtered"
    */
    aliases: {
        value: "filtered",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitFilteredArray"
    */
    visitorMethodName: {
        value: "visitFilteredArray",
        writable: false
    }

});
Selector.registry.registerSelector(FilteredArraySelector);
/**
    @class module:montage/data/selector.FirstArraySelector
*/
var FirstArraySelector = exports.FirstArraySelector = Montage.create(ArraySelector,/** @lends module:montage/data/selector.FirstArraySelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "first"
    */
    aliases: {
        value: "first",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitFirstArray"
    */
    visitorMethodName: {
        value: "visitFirstArray",
        writable: false
    }

});
Selector.registry.registerSelector(FirstArraySelector);
/**
    @class module:montage/data/selector.LastArraySelector
*/
var LastArraySelector = exports.FirstArraySelector = Montage.create(ArraySelector,/** @lends module:montage/data/selector.LastArraySelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "last"
    */
    aliases: {
        value: "last",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitLastArray"
    */
    visitorMethodName: {
        value: "visitLastArray",
        writable: false
    }

});
Selector.registry.registerSelector(LastArraySelector);
/**
    @class module:montage/data/selector.OneArraySelector
*/
var OneArraySelector = exports.OneArraySelector = Montage.create(ArraySelector,/** @lends module:montage/data/selector.OneArraySelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "one"
    */
    aliases: {
        value: "one",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitOneArray"
    */
    visitorMethodName: {
        value: "visitOneArray",
        writable: false
    }

});
Selector.registry.registerSelector(OneArraySelector);
/**
    @class module:montage/data/selector.RequiredOneArraySelector
*/
var RequiredOneArraySelector = exports.RequiredOneArraySelector = Montage.create(ArraySelector,/** @lends module:montage/data/selector.RequiredOneArraySelector# */ {
/**
        Description TODO
        @type {Property}
        @default {String} "requiredOne"
    */
    aliases: {
        value: "requiredOne",
        writable: false
    },
/**
        Description TODO
        @type {Property} Function
        @default {String} "visitRequiredOneArray"
    */
    visitorMethodName: {
        value: "visitRequiredOneArray",
        writable: false
    }

});
Selector.registry.registerSelector(RequiredOneArraySelector);
