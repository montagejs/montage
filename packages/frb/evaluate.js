
var parse = require("./parse");
var compile = require("./compile-evaluator");

module.exports = evaluate;
function evaluate(path, value, parameters) {
    var syntax;
    if (typeof path === "string") {
        syntax = parse(path);
    } else {
        syntax = path;
    }
    var evaluate = compile(syntax);
    return evaluate(value, parameters);
}

