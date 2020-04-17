
var Set = require("collections/set");
var Map = require("collections/map");
var Operators = require("./operators");
module.exports = expand;
function expand(syntax, scope) {
    var bound = expand.semantics.expand.bind(expand.semantics);
    return bound(syntax, scope, bound);
}

expand.semantics = {

    reflexive: new Set([
        "literal",
        "element",
        "rangeContent",
        "mapContent"
    ]),

    traverseLeft: new Set([
        "with",
        "mapBlock",
        "filterBlock",
        "someBlock",
        "everyBlock",
        "sortedBlock",
        "groupBlock",
        "groupMapBlock"
    ]),

    expanders: new Map([[
        "value", function (syntax, scope) {
            return scope.value || {"type": "value"};
        }],[
        "parameters", function (syntax, scope) {
            return scope.parameters || {"type": "parameters"};
        }],[
        "record", function (syntax, scope, expand) {
            var expanded = {type: "record", args: []};
            for (var name in syntax.args) {
                expanded.args[name] = expand(syntax.args[name], scope, expand);
            }
            return expanded;
        }],[
        "component", function (syntax, scope, expand) {
            if (scope.components && syntax.component) {
                return {
                    type: "component",
                    label: scope.components.getObjectLabel(syntax.component)
                };
            } else {
                return syntax;
            }
        }]]),

    expand: function (syntax, scope, expand) {
        if (this.expanders.has(syntax.type)) {
            return this.expanders.get(syntax.type)(syntax, scope, expand);
        } else if (this.traverseLeft.has(syntax.type)) {
            return {type: syntax.type, args: [
                expand(syntax.args[0], scope, expand)
            ].concat(syntax.args.slice(1))};
        } else if (this.reflexive.has(syntax.type)) {
            return syntax;
        } else {
            return {type: syntax.type, args: syntax.args.map(function (arg) {
                return expand(arg, scope, expand);
            })};
        }
    }

};
