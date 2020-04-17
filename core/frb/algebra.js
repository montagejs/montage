
// TODO commute literals on the left side of a target operand, when possible

module.exports = solve;
function solve(target, source) {
    return solve.semantics.solve(target, source);
}

solve.semantics = {

    solve: function (target, source) {
        while (true) {
            // simplify the target
            while (this.simplifiers.hasOwnProperty(target.type)) {
                var simplification = this.simplifiers[target.type](target);
                if (simplification) {
                    target = simplification;
                } else {
                    break;
                }
            }
            var canRotateTargetToSource = this.rotateTargetToSource.hasOwnProperty(target.type);
            var canRotateSourceToTarget = this.rotateSourceToTarget.hasOwnProperty(source.type);
            // solve for bindable target (rotate terms to source)
            if (!canRotateTargetToSource && !canRotateSourceToTarget) {
                break;
            } else if (canRotateTargetToSource) {
                source = this.rotateTargetToSource[target.type](target, source);
                target = target.args[0];
            } else if (canRotateSourceToTarget) {
                target = this.rotateSourceToTarget[source.type](target, source);
                source = source.args[0];
            }
        }

        return [target, source];
    },

    simplifiers: {
        // !!x -> x
        not: function (syntax) {
            var left = syntax.args[0];
            if (left.type === "not") {
                return left.args[0];
            }
        },
        // "" + x -> x.toString()
        add: function (syntax) {
            var left = syntax.args[0];
            if (left.type === "literal" && left.value === "") {
                // "" + x
                // toString(x)
                // because this can be bound bidirectionally with toNumber(y)
                return {
                    type: "toString",
                    args: [syntax.args[1]]
                };
            }
        },
        // DeMorgan's law applied to `some` so we only have to implement
        // `every`.
        // some{x} -> !every{!x}
        someBlock: function (syntax) {
            return {type: "not", args: [
                {type: "everyBlock", args: [
                    syntax.args[0],
                    {type: "not", args: [
                        syntax.args[1]
                    ]}
                ]}
            ]};
        }
    },

    rotateTargetToSource: {
        // e.g.,
        // !y = x
        // y = !x
        reflect: function (target, source) {
            return {type: target.type, args: [source]};
        },
        // e.g.,
        // y + 1 = x
        // y = x - 1
        invert: function (target, source, operator) {
            return {type: operator, args: [
                source,
                target.args[1]
            ]};
        },
        toNumber: function (target, source) {
            return this.reflect(target, source);
        },
        toString: function (target, source) {
            return this.reflect(target, source);
        },
        not: function (target, source) {
            return this.reflect(target, source);
        },
        neg: function (target, source) {
            return this.reflect(target, source);
        },
        add: function (target, source) {
            return this.invert(target, source, 'sub');
        },
        sub: function (target, source) {
            return this.invert(target, source, 'add');
        },
        mul: function (target, source) {
            return this.invert(target, source, 'div');
        },
        div: function (target, source) {
            return this.invert(target, source, 'mul');
        },
        pow: function (target, source) {
            return this.invert(target, source, 'root');
        },
        root: function (target, source) {
            return this.invert(target, source, 'pow');
        },
        // terms.join(delimiter) <- string
        // terms <- string.split(delimiter)
        join: function (target, source) {
            return this.invert(target, source, 'split');
        },
        split: function (target, source) {
            return this.invert(target, source, 'join');
        }
    },

    rotateSourceToTarget: {
        // y = x.rangeContent()
        // y.rangeContent() = x
        rangeContent: function (target, source) {
            if (target.type === "rangeContent") {
                return target;
            } else {
                return {type: source.type, args: [target]};
            }
        }
    }

};

