/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc

All Rights Reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</copyright> */

 /**
    Defines [setImmediate()]{@link setImmediate} and [clearImmediate()]{@link clearImmediate} shim functions.
    @see setImmediate
    @see clearImmediate
    @module montage/core/shim/timers
 */

/**
    @function
    @name setImmediate
    @global
*/

/**
    @function
    @name clearImmediate
    @global
*/

(function (global) {

var nextTick;
if (typeof process !== "undefined") {
    nextTick = process.nextTick;
} else if (typeof MessageChannel !== "undefined") {
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    // linked list of tasks (single, with head node)
    var head = {}, tail = head;

    channel.port1.onmessage = function () {
        var next = head.next;
        var task = next.task;
        head = next;
        task();
    };

    nextTick = function (task) {
        tail = tail.next = {task: task};
        channel.port2.postMessage(void 0);
    }
} else if (typeof setTimeout !== "undefined") {

    nextTick = function (callback) {
        setTimeout(callback, 0);
    };
} else {
    throw new Error("Can't shim setImmediate.");
}

if (typeof setImmediate === "undefined") {
    var nextHandle = 0;
    var handles = {};


    global.setImmediate = function setImmediate(callback) {
        var handle = nextHandle++;
        var args = arguments.length > 1 ?
            Array.prototype.slice.call(arguments, 1) :
            void 0;
        handles[handle] = true;
        nextTick(function () {
            if (handles[handle]) {
                callback.apply(void 0, args);
                delete handles[handle];
            }
        });
        return handle;
    };

    global.clearImmediate = function clearImmediate(handle) {
        delete handles[handle];
    };
}

// Make this work as a <script> for bootstrapping montage.js
if (typeof bootstrap !== "undefined") {
    bootstrap("core/shim/timers", function () {});
}

})(typeof global === "undefined" ? window : global);
