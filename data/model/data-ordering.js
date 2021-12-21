var Montage = require("../../core/core").Montage,
    Enum = require("../../core/enum").Enum,
    ASCENDING = {name: "Ascending"},
    DESCENDING = {name: "Descending"};
    // parse = require("core/frb/parse"),
    // compile = require("core/frb/compile-evaluator"),
    // evaluate = require("core/frb/evaluate"),
    // Scope = require("core/frb/scope");

/*
 * var syntax = parse("a.b");
 * var array = [
 *         {foo: "A", bar: "2"}, {foo: "A", bar: "1"}, {foo: "C", bar: "5"},
 *         {foo: "D", bar: "3"}, {foo: "B", bar: "2"}, {foo: "B", bar: "4"},
 *         {foo: "F", bar: "1"}, {foo: "G", bar: "2"}, {foo: "E", bar: "4"}
 *     ];
 * var sortExpression = "foo";
 * var evaluatedSortExpression = compile(parse("sorted{foo}"));
 * var evaluatedDoubleSortExpression = compile(parse("sorted{foo+bar}"));
 * var evaluatedInvertedSortExpression = compile(parse("sorted{foo}.reversed()"));
 * var evaluatedSyntax = compile(syntax);
 * var c = evaluatedSyntax(new Scope({a: {b: 10}}));
 * var sortedArray = evaluatedSortExpression(new Scope(array));
 * var inverseSortedArray = evaluatedInvertedSortExpression(new Scope(array));
 * var doubleSortedArray = evaluatedDoubleSortExpression(new Scope(array));
 */

var orderTypes = [
    "Ascending",
    "Descending"
];
exports.OrderType = OrderType = new Enum().initWithMembersAndValues(orderTypes,orderTypes);


/**
 * @class
 * @extends external:Montage
 */
exports.DataOrdering = Montage.specialize(/** @lends DataOrdering.prototype */ {

    /**
     * An expression to be applied to objects in a set to yield a value
     * according to which those objects will be sorted.
     *
     * @type {String}
     */
    expression: {
        value: undefined
    },

    /**
     * Whether objects to be sorted will be sorted with the
     * [expression's]{@link DataOrdering#expression} value
     * [ascending]{@link DataOrdering.ASCENDING} or
     * [descending]{@link DataOrdering.DESCENDING}.
     *
     * @type {String}
     */
    order: {
        value: ASCENDING
    }

}, {

    withExpressionAndOrder: {
        value: function (expression, order) {
            var ordering = new this();
            ordering.expression = expression;
            ordering.order = order;
            return ordering;
        }
    },

    Ascending: {
        value: OrderType.Ascending
    },

    Descending: {
        value: OrderType.Descending
    },

    ASCENDING: {
        value: ASCENDING
    },

    DESCENDING: {
        value: DESCENDING
    }

});
