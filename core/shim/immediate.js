/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
    [setImmediate()]{@link setImmediate}
    and [clearImmediate()]{@link clearImmediate} shim functions.
    @see setImmediate
    @see clearImmediate
    @module montage/core/shim/immediate
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

var nextTick = require("../next-tick").nextTick;

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

})(typeof global === "undefined" ? window : global);
