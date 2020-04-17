
require("collections/shim");
var grammar = require("./grammar"),
    Map = require("collections/map");

var memo = new Map(); // could be Dict

module.exports = parse;
function parse(text, options) {
    var cache;
    if (Array.isArray(text)) {
        return {
            type: "tuple",
            args: text.map(function (text) {
                return parse(text, options);
            })
        };
    } else if (!options && (cache = memo.get(text))) {
        return cache;
    } else {
        try {
            var syntax = grammar.parse(text, options || Object.empty);
            if (!options) {
                memo.set(text,syntax);
            }
            return syntax;
        } catch (error) {
            error.message = (
                error.message.replace(/[\s\.]+$/, "") + " " +
                " on line " + error.line + " column " + error.column
            );
            throw error;
        }
    }
}

