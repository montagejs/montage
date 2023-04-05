
var parse = require("./parse");
var compile = require("./compile-evaluator");
var Scope = require("./scope");

// TODO deprecate: this can be done much better with a Scope API
module.exports = evaluate;
function evaluate(path, value, parameters, document, components) {
    var syntax;
    if (typeof path === "string") {
        syntax = parse(path);
    } else {
        syntax = path;
    }
    var evaluate = compile(syntax);
    var scope = new Scope(value);
    scope.parameters = parameters;
    scope.document = document;
    scope.components = components;
    return evaluate(scope);
}

