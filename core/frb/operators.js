
require("collections/shim-object"); // equals, compare
require("collections/shim-regexp"); // escape
var Map = require("collections/map");
var Set = require("collections/set");
// from highest to lowest precedence

exports.toNumber = function (s) {
    return +s;
};

exports.toString = function (value) {
    if (value == null) {
        return value;
    } else if (typeof value === "string" || typeof value === "number") {
        return "" + value;
    } else {
        return null;
    }
};

exports.toArray = Array.from;

exports.toMap = Map.from.bind(Map);

exports.toSet = Set.from.bind(Set);

exports.not = function (b) {
    return !b;
};

exports.neg = function (n) {
    return -n;
};

exports.pow = function (a, b) {
    return Math.pow(a, b);
};

exports.root = function (a, b) {
    return Math.pow(a, 1 / b);
};

exports.log = function (a, b) {
    return Math.log(a) / Math.log(b);
};

exports.mul = function (a, b) {
    return a * b;
};

exports.div = function (a, b) {
    return a / b;
};

exports.mod = function (a, b) {
    return ((a % b) + b) % b;
};

exports.rem = function (a, b) {
    return a % b;
};

exports.add = function (a, b) {
    return a + b;
};

exports.sub = function (a, b) {
    return a - b;
};

exports.ceil = function (n) {
    return Math.ceil(n);
};

exports.floor = function (n) {
    return Math.floor(n);
};

exports.round = function (n) {
    return Math.round(n);
};

exports.lt = function (a, b) {
    return Object.compare(a, b) < 0;
};

exports.gt = function (a, b) {
    return Object.compare(a, b) > 0;
};

exports.le = function (a, b) {
    return Object.compare(a, b) <= 0;
};

exports.ge = function (a, b) {
    return Object.compare(a, b) >= 0;
};

exports.equals = Object.equals;

exports.compare = Object.compare;

exports.and = function (a, b) {
    return a && b;
};

exports.or = function (a, b) {
    return a || b;
};

exports.defined = function (value) {
    return value != null;
};

// "startsWith", "endsWith", and "contains"  are overridden in
// complile-observer so they can precompile the regular expression and reuse it
// in each reaction.

exports.startsWith = function (a, b) {
    var expression = new RegExp("^" + RegExp.escape(b));
    return expression.test(a);
};

exports.endsWith = function (a, b) {
    var expression = new RegExp(RegExp.escape(b) + "$");
    return expression.test(a);
};

exports.contains = function (a, b) {
    var expression = new RegExp(RegExp.escape(b));
    return expression.test(a);
};

exports.join = function (a, b) {
    return a.join(b || "");
};

exports.split = function (a, b) {
    return a.split(b || "");
};

exports.range = function (stop) {
    var range = [];
    for (var start = 0; start < stop; start++) {
        range.push(start);
    }
    return range;
};

exports.last = function (collection) {
    return collection.get(collection.length - 1);
};
