"use strict";

require("collections/shim");

/*
 * See: Introduction to Algorithms, Longest Common Subsequence, Algorithms,
 * Cormen et al, 15.4
 * This is an adaptation of the LCS and Lehvenstein distance algorithm that
 * instead of computing the longest subsequence, or the cost of edit, finds the
 * shortest operational transform.  The cost is the cost of traversal in terms
 * of "insert" and "delete" operations, where "retain" is free.
 */
exports.graphOt = graphOt;
function graphOt(target, source) {
    var size = (source.length + 1) * (target.length + 1);

    // edges is a 2D linearized array with a height of target.length + 1 and a
    // width of source.length + 1.  Each cell corresponds to an operational
    // transform walking from the top-left to the bottom-right.
    var edges = Array(size);
    // we only need to know the costs of the previous source column and the
    // current source column up to the cell in question.
    var theseCosts = Array(source.length + 1);
    var prevCosts = Array(source.length + 1);
    var tempCosts;

    for (var t = 0; t < target.length + 1; t++) {
        for (var s = 0; s < source.length + 1; s++) {
            var direction, cost;
            if (t === 0 && s === 0) {
                direction = " ";
                cost = 0;
            } else if (t === 0) {
                direction = "insert";
                cost = s;
            } else if (s === 0) {
                direction = "delete";
                cost = t;
            } else if (target[t - 1] === source[s - 1]) {
                direction = "retain";
                cost = prevCosts[s - 1];
            } else {
                var tCost = theseCosts[s - 1];
                var sCost = prevCosts[s];
                // favoring the source tends to produce more removal followed
                // by insertion, which packs into a swap transforms better
                if (sCost < tCost) {
                    direction = "delete";
                    cost = sCost + 1;
                } else {
                    direction = "insert";
                    cost = tCost + 1;
                }
            }
            edges[t + s * (target.length + 1)] = direction;
            theseCosts[s] = cost;

        }
        // swap columns, reuse and overwrite the previous column as the current
        // column for the next iteration.
        tempCosts = theseCosts;
        theseCosts = prevCosts;
        prevCosts = tempCosts;
    }

    return {
        edges: edges,
        cost: prevCosts[source.length],
        source: source,
        target: target
    };
}

/**
 * Tracks backward through a graph produced by graphOt along the cheapest path
 * from the bottom-right to the top-left to produce the cheapest sequence of
 * operations.  Accumulates adjacent operations of the same type into a single
 * operation of greater length.
 */
exports.traceOt = traceOt;
function traceOt(graph) {
    var ops = [];
    var edges = graph.edges;
    var t, tl = t = graph.target.length;
    var s = graph.source.length;
    var previous;
    while (t || s) {
        var direction = edges[t + s * (tl + 1)];
        if (direction === "delete") {
            if (previous && previous[0] === "delete") {
                previous[1]++;
            } else {
                var op = ["delete", 1];
                previous = op;
                ops.push(op);
            }
            t--;
        } else if (direction === "insert") {
            if (previous && previous[0] === "insert") {
                previous[1]++;
            } else {
                var op = ["insert", 1];
                previous = op;
                ops.push(op);
            }
            s--;
        } else if (direction === "retain") {
            var op = ["retain", 1];
            if (previous && previous[0] === "retain") {
                previous[1]++;
            } else {
                previous = op;
                ops.push(op);
            }
            t--; s--;
        }
    }
    ops.reverse();
    return ops;
}

/**
 * Compute the shortest operational transform on the target sequence to become
 * the source sequence.
 */
exports.ot = ot;
function ot(target, source) {
    return traceOt(graphOt(target, source));
}

/**
 * Compute the shortest sequence of splice or swap operations on the target
 * sequence to become the source sequence.
 */
exports.diff = diff;
function diff(target, source) {
    var ops = ot(target, source);
    var swops = [];

    // convert ops to splice/swap operations
    var t = 0;
    var s = 0;
    var o = 0;
    var previous;
    while (o < ops.length) {
        var op = ops[o++];
        if (op[0] === "insert") {
            swops.push([s, 0, source.slice(s, s + op[1])]);
            s += op[1];
        } else if (op[0] === "delete") {
            if (o < ops.length && ops[o][0] === "insert") {
                var insert = ops[o++];
                swops.push([s, op[1], source.slice(s, s + insert[1])]);
                t += op[1];
                s += insert[1];
            } else {
                swops.push([s, op[1]]);
                t += op[1];
            }
        } else if (op[0] == "retain") {
            t += op[1];
            s += op[1];
        }
    }

    return swops;
}

/**
 * Apply the given sequence of swap operations on the target sequence.
 */
exports.apply = apply;
function apply(target, patch) {
    for (var s = 0; s < patch.length; s++) {
        target.swap.apply(target, patch[s]);
    }
}

/**
 * Apply the shortest sequence of swap operations on the target sequence for it
 * to become equivalent to the target sequence.
 */
exports.merge = merge;
function merge(target, source) {
    apply(target, diff(target, source));
}

