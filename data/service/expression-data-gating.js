var DataGating = require("./data-gating").DataGating,
    assign = require("core/frb/assign"),
    compile = require("core/frb/compile-evaluator"),
    DataService = require("data/service/data-service").DataService,
    Criteria = require("core/criteria").Criteria,
    ObjectDescriptorReference = require("core/meta/object-descriptor-reference").ObjectDescriptorReference,
    parse = require("core/frb/parse"),
    Map = require("core/collections/map"),
    MappingRule = require("data/service/mapping-rule").MappingRule,
    Promise = require("core/promise").Promise,
    Scope = require("core/frb/scope"),
    Set = require("core/collections/set"),
    deprecate = require("core/deprecate"),
    RawForeignValueToObjectConverter = require("data/converter/raw-foreign-value-to-object-converter").RawForeignValueToObjectConverter,
    DataOperation = require("./data-operation").DataOperation,
    Montage = require("montage").Montage;


/**
 * Assess if a DataOperation can be performed, using FRB expressions.
 *
 * TODO: Write more thorough description.
 *
 * @class
 * @extends external:DataMapping
 */
exports.ExpressionDataGating = DataGating.specialize(/** @lends ExpressionDataMapping.prototype */ {


});
