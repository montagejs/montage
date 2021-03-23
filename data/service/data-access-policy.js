/**
 * @module montage/data/service/data-accesss-policy
 */

var Montage = require("core/core").Montage;

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
exports.DataAccessPolicy = Montage.specialize(/** @lends DataAccessPolicy.prototype */ {


    /**
     * The ObjectDescriptor for which this policy express access rules.
     * @type {ObjectDescriptor}
     */
    _objectDescriptor: {
        value: undefined
    },
    objectDescriptor: {
        get: function () {
            return this._objectDescriptor;
        },
        set: function (value) {
            this._objectDescriptor = value;
        }
    },

    deserializeSelf: {
        value: function (deserializer) {
            var result, value;

            value = deserializer.getProperty("objectDescriptor");
            if (value !== void 0) {
                this.objectDescriptor = value;
            }

            value = deserializer.getProperty("dataOperationTypePolicyRules");
            if (value !== void 0) {
                this.dataOperationTypePolicyRules = value;
            }
        }
    },

    accessRulesForDataOperation: {
        value: function(dataOperation) {
            return this.dataOperationTypePolicyRules[dataOperation.type];
        }
    },

    /*

        Because of a require issue we can't use Promise.isPromise from core/promise ....
    */

    _isAsync: {
        value: function (object) {
            return object && object.then && typeof object.then === "function";
        }
    },

    /*

        We might want to have 2 set of rules, one that specifically set canBePerformed / isAuthorized. If more than one rule assess that, each could do:
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
            var self = this,
                accessRules = this.accessRulesForDataOperation(dataOperation),
                i, countI, iAccessRule, iAccessRuleEvaluation, iAccessRuleEvaluationPromises;

            /*
                Creating a new prommise here so we can't resolve(false) as early as the first rule that does, for performance reason.
            */

            return new Promise(function(resolve, reject) {

                for( i=0, countI=accessRules.length; (i<countI); i++ ) {
                    iAccessRule = accessRules[i];
                    iAccessRuleEvaluation = iAccessRule.evaluate(dataOperation);

                    /*
                        Later when we refine, we might want to cut short at the first no/can't do
                    */
                    // if(iAccessRuleEvaluation === false) {
                    //     resolve(iAccessRuleEvaluation);
                    //     return;
                    // }

                    if(self._isAsync(iAccessRuleEvaluation)) {
(iAccessRuleEvaluationPromises || (iAccessRuleEvaluationPromises = [])).push(iAccessRuleEvaluation);
                    }
                }

                if(iAccessRuleEvaluationPromises && iAccessRuleEvaluationPromises.length > 0) {
                    Promise.all(iAccessRuleEvaluationPromises)
                    .then(function() {
                        //whatever the rules do, they set a state on the dataOperation, so nothing to resolve.
                        resolve();
                    })
                } else {
                    //whatever the rules do, they set a state on the dataOperation, so nothing to resolve.
                    resolve();
                }

            });




        }
    }


});
