
require("collections/shim-object"); // shim equals, compare

// from highest to lowest precedence

exports.number = function (s) {
    if (typeof s === "number") {
        return s;
    } else if (typeof s === "string") {
        return parseInt(s, 10) || 0;
    } else {
        return 0;
    }
};

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

exports.equals = function (a, b) {
    return Object.equals(a, b);
};

exports.and = function (a, b) {
    return a && b;
};

exports.or = function (a, b) {
    return a || b;
};

// TODO startsWith
// TODO endsWith
// TODO contains

