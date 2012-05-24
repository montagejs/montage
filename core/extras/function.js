/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to native Function object.
    @see [Function class]{@link external:Function}
    @module montage/core/extras/function
*/

/**
    @external Function
*/


require("./object");

// TODO
/**
*/
Object.defineProperty(Function, "identity", {
    value: function (x) {
        return x;
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Function, "noop", {
    value: function () {
    },
    writable: true
});

// TODO
/**
*/
Object.defineProperty(Function, "by", {
    value: function (by, compare) {
        compare = compare || Object.compare;
        by = by || Function.identity;
        var compareBy = function (a, b) {
            return compare(by(a), by(b));
        };
        compareBy.compare = compare;
        compareBy.by = by;
        return compareBy;
    },
    writable: true
});

