
require("../collections/shim");
var grammar = require("./grammar-peggy"),
    //grammar = require("./grammar"),
    Map = require("../collections/map");

var memo = new Map(); // could be Dict

module.exports = parse;
function parse(text, options) {
    var syntax;
    if (Array.isArray(text)) {
        return {
            type: "tuple",
            args: text.map(function (text) {
                return parse(text, options);
            })
        };
    } else if (!options && (syntax = memo.get(text))) {
        return syntax;
    } else {
        try {
            syntax = grammar.parse(text, options || Object.empty);
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
