/**
 * @module montage/data/service/data-access-policy-rule
 */

var Montage = require("../../core/core").Montage;

/**
 * Sets an expression (left) on a data operation to the value resulting from the evaluation of a right expression,
 * to contribute to the decision of wether a data operation can be performed as is or as modified.
 * For examples, rules can be used to set values to properties or modify property content,
 * like filtering an operation read expressions before it gets executed by the relevant RawDataService.
 *
 *
 * @class
 * @extends external:Montage
 */


exports.DataAccessPolicyRule = Montage.specialize(/** @lends DataAccessPolicyRule.prototype */ {

    evaluate: {
        value: function(dataOperation) {
        }
    }
});

