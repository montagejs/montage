
var parse = require("./parse");
var compile = require("./compile-observer");
var Observers = require("./observers");

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
        observe = Observers.makeContentObserver(observe);
    }

    return observe(Observers.autoCancelPrevious(function (value) {
        if (typeof contentChange === "function") {
            value.addRangeChangeListener(contentChange);
            return Observers.once(function () {
                value.removeRangeChangeListener(contentChange);
            });
        } else {
            return descriptor.change.apply(object, arguments);
        }
    }), object, parameters, beforeChange);
}

var empty = {};

