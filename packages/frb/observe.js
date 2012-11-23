
var parse = require("./parse");
var compile = require("./compile-observer");
var Observers = require("./observers");
var autoCancelPrevious = Observers.autoCancelPrevious;

module.exports = observe;
function observe(object, path, descriptorOrFunction) {
    var descriptor;
    if (typeof descriptorOrFunction === "function") {
        descriptor = {change: descriptorOrFunction};
    } else {
        descriptor = descriptorOrFunction;
    }

    descriptor = descriptor || empty;
    descriptor.source = object;
    descriptor.sourcePath = path;
    var parameters = descriptor.parameters = descriptor.parameters || object;
    var beforeChange = descriptor.beforeChange;
    var contentChange = descriptor.contentChange;

    var syntax = parse(path);
    var observe = compile(syntax);

    // decorate for content change observations
    if (contentChange === true) {
        observe = Observers.makeRangeContentObserver(observe);
    }

    return observe(autoCancelPrevious(function (value) {
        if (!value) {
        } else if (typeof contentChange !== "function") {
            return descriptor.change.apply(object, arguments);
        } else if (typeof contentChange === "function") {
            value.addRangeChangeListener(contentChange);
            return Observers.once(function () {
                value.removeRangeChangeListener(contentChange);
            });
        }
    }), object, parameters, beforeChange);
}

var empty = {};

