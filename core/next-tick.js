/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/*global bootstrap,setImmediate */
/**
   Provides [nextTick]{@link nextTick}
   @see nextTick
   @module montage/core/next-tick
*/
/**
    Executes a function as soon as possible in a future event.  The task
    is not cancelable.
    @function module:montage/core/next-tick#nextTick
    @param {Function} task a function to call in a future turn of the event loop
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

    // queue of tasks implemented as a singly linked list with a head node
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
    };

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
