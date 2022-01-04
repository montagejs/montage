/**
 * @module montage/data/service/data-accesss-policy
 */

var Montage = require("../../core/core").Montage,
    Promise = require("../../core/promise").Promise,
    DataOperation = require("./data-operation").DataOperation,
    DataAccessPolicy;


/**
 * Assess if a DataOperation can be performed. Should that be called DataAccessPolicy
 *
 *
 * @class
 * @extends external:Montage
 */


 /*

With a section on authorizeConnectionOperation
With expression like « query.type.name == ´Event’ && query.criteria.expressionSyntax == ... »
That feels much solid and aligned with the rest of the design

 */
DataAccessPolicy = exports.DataAccessPolicy = Montage.specialize(/** @lends DataAccessPolicy.prototype */ {


    // /**
    //  * The ObjectDescriptor for which this policy express access rules.
    //  * @type {ObjectDescriptor}
    //  */
    // _objectDescriptor: {
    //     value: undefined
    // },
    // objectDescriptor: {
    //     get: function () {
    //         return this._objectDescriptor;
    //     },
    //     set: function (value) {
    //         this._objectDescriptor = value;
    //     }
    // },

    /**
     * The dataOperation currently being evaluated.
     * @type {ObjectDescriptor}
     */
    dataOperation: {
        value: undefined
    },

    // dataOperationTypePolicyRules: {
    //     value: undefined
    // },

    nextPoliciesKeyCriteria: {
        value: undefined
    },

    dataOperationTypePolicyRules: {
        value: undefined
    },

    nextPoliciesMap: {
        value: undefined
    },

    deserializeSelf: {
        value: function (deserializer) {
            var result, value;

            // value = deserializer.getProperty("objectDescriptor");
            // if (value !== void 0) {
            //     this.objectDescriptor = value;
            // }

            // value = deserializer.getProperty("dataOperationTypePolicyRules");
            // if (value !== void 0) {
            //     this.dataOperationTypePolicyRules = value;
            // }

            value = deserializer.getProperty("nextPoliciesKeyCriteria");
            if (value !== void 0) {
                this.nextPoliciesKeyCriteria = value;
            }

            value = deserializer.getProperty("nextPoliciesMap");
            if (value !== void 0) {
                this.nextPoliciesMap = value;
            }

            value = deserializer.getProperty("dataOperationCriteriaRuleMap");
            if (value !== void 0) {
                this.dataOperationCriteriaRuleMap = value;
            } else if(process && typeof process.env.NODE_ENV !== "undefined" && process.env.NODE_ENV !== "production") {
                console.warn("no value for dataOperationCriteriaRuleMap");
            }

        }
    },

    accessRulesForDataOperation: {
        value: function(dataOperation) {

            /*
                Replace lookup with evaluating the criteria - keys - in dataOperationCriteriaRuleMap.
            */
            var dataOperationCriteriaRuleMap = this.dataOperationCriteriaRuleMap,
                matchingRules;

            if(dataOperationCriteriaRuleMap) {
                var criteriaIterator = dataOperationCriteriaRuleMap.keys(),
                    iteration,
                iCriteria;

                while(!(iteration = criteriaIterator.next()).done) {
                    iCriteria = iteration.value;

                    if(!iCriteria || (iCriteria && iCriteria.evaluate(dataOperation))) {
                        (matchingRules || (matchingRules = [])).push.apply(matchingRules,(dataOperationCriteriaRuleMap.get(iCriteria)));
                    }
                }
            }
            return matchingRules;



            //return this.dataOperationTypePolicyRules[dataOperation.type];
        }
    },

    _evaluateAccessRuleForDataOperation: {
        value: function(iAccessRule, dataOperation, promise) {
            if(promise) {
                return promise.then(() => {
                    return iAccessRule.evaluate(dataOperation);
                });
            } else {
                return iAccessRule.evaluate(dataOperation);
            }
        }
    },

    /*

        We might want to have 2 set of rules, one that specifically set isAuthorized / isAuthorized. If more than one rule assess that, each could do:
                "isAuthorized": {
                    "=": "isAuthorized && (target == @DataIdentityDescriptor && criteria.expression == 'originId == $.originId' && criteria.parameters.originId.defined() && identity.query)",
                    "converter": {"@": "hasQueryResultConverter"}
                }
        but we can't because we here need the expression to return a query and that value is passed to the converter that will return a boolean. But that expression just replaces isAuthorized, I don't think we have an operator/function that would do that on the left side?

        The goal here is that as soon as one rule evaluates to false, we should resolve the answer without waiting for the rest. Forcing to have only one rule may not be great for maintainability.

        and another set of rules that for example would filter readExpressions. These need to all run.

    */
    evaluate: {
        value: function(dataOperation) {


            /*
                This will enables us to use bindings on the DataAccessPolicy to update criteria in the serialization, or in code.
            */
            this.dataOperation = dataOperation;

            var self = this,
                accessRules = this.accessRulesForDataOperation(dataOperation),
                i, countI, iAccessRule, iAccessRuleEvaluation, iAccessRuleEvaluationPromises,
                previousPromise,
                promise,

                accessRulesEvaluationPromise;

            /*
                Creating a new prommise here so we can't resolve(false) as early as the first rule that does, for performance reason.
            */

            if(!accessRules) {
                accessRulesEvaluationPromise = Promise.resolve();
            } else {

                // accessRulesEvaluationPromise = new Promise(function(resolve, reject) {

                    for( i=0, countI=accessRules.length; (i<countI); i++ ) {
                        iAccessRule = accessRules[i];
                        accessRulesEvaluationPromise = this._evaluateAccessRuleForDataOperation(iAccessRule, dataOperation, accessRulesEvaluationPromise);
                        /*
                            Later when we refine, we might want to cut short at the first no/can't do
                        */
                        // if(iAccessRuleEvaluation === false) {
                        //     resolve(iAccessRuleEvaluation);
                        //     return;
                        // }

                    }

                    // if(iAccessRuleEvaluationPromises && iAccessRuleEvaluationPromises.length > 0) {
                    //     Promise.all(iAccessRuleEvaluationPromises)
                    //     .then(function() {
                    //         //whatever the rules do, they set a state on the dataOperation, so nothing to resolve.
                    //         resolve();
                    //     })
                    // } else {
                    //     //whatever the rules do, they set a state on the dataOperation, so nothing to resolve.
                    //     resolve();
                    // }

                // })
            }

            if(!accessRulesEvaluationPromise) {
                accessRulesEvaluationPromise = Promise.resolve();
            }

            return accessRulesEvaluationPromise
            /*
                Now propagate to next policies if any:
            */
            .then(function() {
                if(self.nextPoliciesMap) {
                    var nextPolicies, nextPoliciesEvaluationPromises;

                    if(self.nextPoliciesKeyCriteria) {
                        var keyValue = self.nextPoliciesKeyCriteria.evaluate(dataOperation);

                        if(keyValue !== null && keyValue !== undefined) {
                            nextPolicies = self.nextPoliciesMap.get(keyValue);

                            if(nextPolicies) {
                                for(var i=0, countI = nextPolicies.length, iPolicy, iPolicyEvaluation; (i < countI); i++) {
                                    iPolicy = nextPolicies[i];
                                    iPolicyEvaluation = iPolicy.evaluate(dataOperation);
                                    if(Promise.is(iPolicyEvaluation)) {
                                        (nextPoliciesEvaluationPromises || (nextPoliciesEvaluationPromises = [])).push(iPolicyEvaluation);
                                    }
                                }

                                if(nextPoliciesEvaluationPromises && nextPoliciesEvaluationPromises.length > 0) {
                                    return Promise.all(nextPoliciesEvaluationPromises);
                                } else {
                                    //whatever the rules do, they set a state on the dataOperation, so nothing to resolve.
                                    return Promise.resolve();
                                }
                            }
                        }

                    } else {
                        /*
                            No criteria to do a quick lookup. If there are entries in the map, we're going to loop on all of them
                        */
                    }
                } else {
                    return Promise.resolve();
                }
            });
        }
    }


});


/*
    Loop to create getters that create criteria for a DataOperation's type, for all known types:

    like            "expression": "type == 'authorizeConnectionOperation'"

*/
// for(
//     var proto = DataAccessPolicy.prototype,
//         types = DataOperation.Type,
//         dataOperationTypes = Object.keys(types),
//         i=0, iType, iPropertyName, iPrivateiPropertyName, countI = dataOperationTypes.length;
//         (i<countI);
//         i++
//     ) {
//         defineCriteriaGetterForDataOperationType(types[dataOperationTypes[i]], proto);
//     }

// function defineCriteriaGetterForDataOperationType(type, proto) {

//     var iPropertyName = (type+"TypeCriteria"),
//         iPrivatePropertyName = ("_"+iPropertyName);

//     Montage.defineProperty(proto, iPropertyName, {
//         value: function () {
//             return this[iPrivatePropertyName] || (this[iPrivatePropertyName] = new Criteria().initWithExpression(("type == '"+type+"'")));
//         }
//     });
// }
