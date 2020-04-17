
{
    var BINARY = {
        "**": "pow",
        "//": "root",
        "%%": "log",
        "*": "mul",
        "/": "div",
        "%": "mod",
        "rem": "rem",
        "+": "add",
        "-": "sub",
        "<": "lt",
        ">": "gt",
        "<=": "le",
        ">=": "ge",
        "==": "equals",
        "<=>": "compare",
        "??": "default",
        "&&": "and",
        "||": "or",
        "<-": "bind",
        "<->": "bind2",
        ":": "assign"
    };

    var UNARY = {
        "+": "toNumber",
        "-": "neg",
        "!": "not",
        "^": "parent"
    };

    var BLOCKS = {
        "map": "mapBlock",
        "filter": "filterBlock",
        "some": "someBlock",
        "every": "everyBlock",
        "sorted": "sortedBlock",
        "sortedSet": "sortedSetBlock",
        "group": "groupBlock",
        "groupMap": "groupMapBlock",
        "min": "minBlock",
        "max": "maxBlock"
    };

    var STATEMENTS = {
        ":": "assign",
        "<-": "bind",
        "<->": "bind2"
    };

}

expression "expression" = if

expressions
    = head:expression tail:("," _ expression)* _ {
        var result = [head];
        for (var i = 0; i < tail.length; i++) {
            result.push(tail[i][2]);
        }
        return result;
    }

args
    = "(" _ ")" {
        return [];
    }
    / "(" expressions:expressions ")" {
        return expressions;
    }

if
    = condition:or _ tail:( "?" _ conequent:expression _ ":" _ alternate:expression )? {
        if (tail) {
            var consequent = tail[2];
            var alternate = tail[6];
            return {
                type: "if",
                args: [condition, consequent, alternate]
            };
        } else {
            return condition;
        }
    }

or
    = head:and tail:( _ "||" _ and)* {
        for (var i = 0; i < tail.length; i++) {
            head = {
                type: BINARY[tail[i][1]],
                args: [
                    head,
                    tail[i][3]
                ]
            }
        }
        return head;
    }

and
    = head:comparison tail:( _ "&&" _ comparison)* {
        for (var i = 0; i < tail.length; i++) {
            head = {
                type: BINARY[tail[i][1]],
                args: [
                    head,
                    tail[i][3]
                ]
            }
        }
        return head;
    }

comparison
    = left:arithmetic tail:( _ operator:$( "<=>" / "<=" / ">=" / "<" !("-") / ">" / "==" / "!=" ) _ right:arithmetic )? {
        if (!tail) {
            return left;
        } else {
            var operator = tail[1];
            var right = tail[3];
            if (operator === "!=") {
                return {type: "not", args: [{type: "equals", args: [left, right]}]};
            } else {
                return {type: BINARY[operator], args: [left, right]};
            }
        }
    }

arithmetic
    = head:multiplicative tail:( _ $( "+" / "-" ) _ multiplicative)* {
        for (var i = 0; i < tail.length; i++) {
            head = {
                type: BINARY[tail[i][1]],
                args: [
                    head,
                    tail[i][3]
                ]
            }
        }
        return head;
    }

multiplicative
    = head:exponential tail:( _ $( "*" / "/" / "%" / "rem" ) _ exponential)* {
        for (var i = 0; i < tail.length; i++) {
            head = {
                type: BINARY[tail[i][1]],
                args: [
                    head,
                    tail[i][3]
                ]
            }
        }
        return head;
    }

exponential
    = head:default tail:( _ $( "**" / "//" / "%%" ) _ default)* {
        for (var i = 0; i < tail.length; i++) {
            head = {
                type: BINARY[tail[i][1]],
                args: [
                    head,
                    tail[i][3]
                ]
            }
        }
        return head;
    }

default
    = head:unary tail:( _ "??" _ unary)* {
        for (var i = 0; i < tail.length; i++) {
            head = {
                type: BINARY[tail[i][1]],
                args: [
                    head,
                    tail[i][3]
                ]
            }
        }
        return head;
    }

unary
    = operator:$("!" / "+" / "-") arg:unary {
        return {type: UNARY[operator], args: [arg]};
    }
    / pipe

pipe
    = head:value tail:chain* {
        for (var i = 0; i < tail.length; i++) {
            head = tail[i](head);
        }
        return head;
    }

chain
    = "." tail:tail {
        return tail;
    }
    / "[" arg:expression "]" {
        return function (previous) {
            return {
                type: "property",
                args: [
                    previous,
                    arg
                ]
            };
        };
    }

tail
    = name:$(word) "{" _ expression:expression _ "}" {
        if (BLOCKS[name]) {
            return function (previous) {
                return {
                    type: BLOCKS[name],
                    args: [previous, expression]
                };
            }
        } else if (expression.type === "value") {
            return function (previous) {
                return {
                    type: name,
                    args: [previous]
                };
            };
        } else {
            return function (previous) {
                return {
                    type: name,
                    args: [
                        {type: "mapBlock", args: [
                            previous,
                            expression
                        ]}
                    ]
                };
            };
        }
    }
    / name:$(word) args:args {
        return function (previous) {
            return {
                type: name,
                args: [previous].concat(args)
            };
        };
    }
    / index:digits {
        return function (previous) {
            return {
                type: "property",
                args: [
                    previous,
                    {type: "literal", value: +index.join("")}
                ]
            };
        };
    }
    / name:$(word) {
        return function (previous) {
            return {
                type: "property",
                args: [
                    previous,
                    {type: "literal", value: name}
                ]
            };
        };
    }
    / expression:array {
        return function (previous) {
            return {
                type: "with",
                args: [
                    previous,
                    expression
                ]
            };
        };
    }
    / expression:object {
        return function (previous) {
            return {
                type: "with",
                args: [
                    previous,
                    expression
                ]
            };
        };
    }
    / "(" expression:expression ")" {
        return function (previous) {
            return {
                type: "with",
                args: [
                    previous,
                    expression
                ]
            };
        };
    }

value
    = array
    / object
    / string
    / number
    / "this" { return {type: "value"}; }
    / "true" { return {type: "literal", value: true}; }
    / "false" { return {type: "literal", value: false}; }
    / "null" { return {type: "literal", value: null}; }
    / "@" label:$(label) {
        return {type: "component", label: label};
    }
    / "$" name:$(word) {
        return {type: "property", args: [
            {type: "parameters"},
            {type: "literal", value: name}
        ]};
    }
    / "$" {
        return {type: "parameters"};
    }
    / "#" name:$(word) {
        return {type: "element", id: name};
    }
    / "&" name:$(word) args:args {
        return {type: name, args: args, inline: true};
    }
    / "^" value:value {
        return {type: "parent", args: [value]};
    }
    / "(" expression:expression ")" {
        return expression;
    }
    / tail:tail {
        return tail({type: "value"});
    }
    / {
        return {type: "value"};
    }

word "word"
    = [a-zA-Z_0-9-]+

string "string"
    = "'" chars:tickedChar* "'" { return {type: "literal", value: chars.join("")}; }
    / '"' chars:quotedChar* '"' { return {type: "literal", value: chars.join("")}; }

tickedChar
    = [^'\\\0-\x1F\x7f]
    / "\\'"  { return "'";  }
    / escape

quotedChar
    = [^"\\\0-\x1F\x7f]
    / "\\\""  { return "\"";  }
    / escape

escape
    = "\\\\" { return "\\"; }
    / "\\/"  { return "/";  }
    / "\\b"  { return "\b"; }
    / "\\f"  { return "\f"; }
    / "\\n"  { return "\n"; }
    / "\\r"  { return "\r"; }
    / "\\t"  { return "\t"; }
    / "\\0"  { return "\0"; }
    / "\\u" digits:$(hexDigit hexDigit hexDigit hexDigit) {
        return String.fromCharCode(parseInt(digits, 16));
    }

hexDigit
    = [0-9a-fA-F]

array
    = "[" _ "]" {
        return {type: "tuple", args: []};
    }
    / "[" _ expressions:expressions _ "]" {
        return {type: "tuple", args: expressions};
    }

object
    = "{" _ "}" _ { return {type: "record", args: []}; }
    / "{" _ pairs:pairs "}" _ { return {type: "record", args: pairs}; }

pairs
    = head:pair tail:( "," _ pair )* {
        var result = {};
        result[head[0]] = head[1];
        for (var i = 0; i < tail.length; i++) {
            result[tail[i][2][0]] = tail[i][2][1];
        }
        return result;
    }

pair
    = name:$(word) ":" _ value:expression { return [name, value]; }


// literals closely modeled after the JSON PEGJS example

number "number"
    = parts:$(numberPattern) {
        return {type: "literal", value: +parts}
    }

numberPattern
    = int frac exp
    / int frac
    / int exp
    / int

int
    = digit19 digits
    / digit
    / "-" digit19 digits
    / "-" digit

frac
    = "." digits

exp
    = e digits

digits
    = digit+

e
    = [eE] [+-]?

digit
    = [0-9]

digit19
    = [1-9]

// white space and comments defined as in the JavaScript PEGJS example

_
    = ( whiteSpace / lineTerminator )*

whiteSpace "whitespace"
    = [\t\v\f \u00A0\uFEFF]
    / [\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]

lineTerminator "line terminator"
    = [\n\r\u2028\u2029]

comment
    = _ "/*" comment:$(!"*/" . )* "*/" _ {
        return comment;
    }
    / _ {
        return null;
    }

// MCS extensions

sheet
    = _ blocks:block* _ {
        return {type: "sheet", blocks: blocks};
    }

block
    = "@" label:$(label) _ annotation:annotation? "{" _ statements:statements "}" _ {
        return {
            type: "block",
            connection: annotation.connection,
            module: annotation.module,
            exports: annotation.exports,
            label: label,
            statements: statements
        };
    }

annotation
    = connection:("<" / ":") _ module:string? _ exports:( !"{" expression )? _ {
        return {
            connection: {"<": "prototype", ":": "object"}[connection],
            module: module && module.value,
            exports: exports !== "" ? exports[1] : undefined
        };
    }
    / _ {
        return {};
    }

label
    = [a-zA-Z_0-9]+ ( ":" [a-zA-Z_0-9]+ )*

statements
    = head:statement _ tail:(";" _ statement _)* ";"? _ {
        var result = [head];
        for (var i = 0; i < tail.length; i++) {
            result.push(tail[i][2]);
        }
        return result;
    }
    / statement:statement _ ";"? _ {
        return [statement];
    }
    / _ {
        return [];
    }

statement
    = when:("on" / "before") " " _ type:$(word) _ "->" _ listener:expression _ {
        return {type: "event", when: when, event: type, listener: listener};
    }
    / target:expression _ arrow:(":" / "<->" / "<-") _ source:expression _
      descriptor:("," _ name:$(word) _ ":" _ expression:expression _)*
    {
        var result = {type: STATEMENTS[arrow], args: [
            target,
            source
        ]};
        if (descriptor.length) {
            var describe = {};
            for (var i = 0; i < descriptor.length; i++) {
                describe[descriptor[i][2]] = descriptor[i][6];
            }
            result.descriptor = describe;
        }
        return result;
    }
    / name:$(word) _ expression:expression _ {
        return {type: "unit", name: name, value: expression};
    }


