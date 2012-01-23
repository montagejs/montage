/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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
} else if (typeof setImmediate === "undefined") {
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
} else {
    // If setImmediate is native, use it as nextTick since
    // that should have less overhead than the nextTick
    // shim
    nextTick = setImmediate;
}

// Publish nextTick because it either is setImmediate or it
// is a shim that has less overhead than the setImmediate
// shim.
global.nextTick = nextTick;

// Make this work as a <script> for bootstrapping montage.js
if (typeof bootstrap !== "undefined") {
    bootstrap("core/shim/timers", function () {});
}

})(typeof global === "undefined" ? window : global);
