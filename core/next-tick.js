/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    Defines nextTick() function
    @see nextTick
    @module montage/core/next-tick
*/

/**
    @function module:montage/core/next-tick#nextTick
*/

(function (definition) {
    if (typeof bootstrap !== "undefined") {
        bootstrap("core/next-tick", definition);
    } else if (typeof require !== "undefined") {
        definition(require, exports, module);
    } else {
        definition({}, {}, {});
    }
})(function (require, exports, module) {

var nextTick;
// Node implementation:
if (typeof process !== "undefined") {
    nextTick = process.nextTick;
// Browser implementation: based on MessageChannel, setImmediate, or setTimeout
} else {

    // queue of tasks implemented as a sin`y linked list with a head node
    var head = {}, tail = head;
    // whether a task is pending is represented by the existence of head.next

    nextTick = function (task) {
        var alreadyPending = head.next;
        tail = tail.next = {task: task};
        if (!alreadyPending) {
            // setImmediate,
            // postMessage, or
            // setTimeout:
            request(flush, 0);
        }
    }

    var flush = function () {
        try {
            // unroll all pending events
            while (head.next) {
                head = head.next;
                // guarantee consistent queue state
                // before task, because it may throw
                head.task(); // may throw
            }
        } finally {
            // if a task throws an exception and
            // there are more pending tasks, dispatch
            // another event
            if (head.next) {
                // setImmediate,
                // postMessage, or
                // setTimeout:
                request(flush, 0);
            }
        }
    };

    var request; // must always be called like request(flush, 0);
    // in order of desirability:
    if (typeof setImmediate !== "undefined") {
        request = setImmediate;
    } else if (typeof MessageChannel !== "undefined") {
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        channel.port1.onmessage = flush;
        request = function (flush, zero) {
            channel.port2.postMessage(0);
        };
    } else {
        request = setTimeout;
    }

}

exports.nextTick = nextTick;

});
