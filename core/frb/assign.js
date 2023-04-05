
var parse = require("./parse");
var compile = require("./compile-assigner");
var Scope = require("./scope");

// TODO deprecate.  this is too easy to implement better at other layers,
// depending on scopes.
module.exports = assign;
function assign(target, path, value, parameters, document, components) {
    var syntax;
    if (typeof path === "string") {
        syntax = parse(path);
    } else {
        syntax = path;
    }
    var assign = compile(syntax);
    var scope = new Scope(target);
    scope.parameters = parameters;
    scope.document = document;
    scope.components = components;
    return assign(value, scope);
}

