/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to intrinsic <code>Function</code> object.
    @see [Function class]{@link external:Function}
    @module montage/core/extras/function
*/

/**
    @external Function
*/

require("./object");

/**
    A utility to reduce unnecessary allocations of <code>function (x) {return
    x}</code> in its many colorful but ultimately wasteful parameter name
    variations.

    @function external:Function.identity
    @param {Any} any value
    @returns {Any} that value
*/
Object.defineProperty(Function, "identity", {
    value: function (x) {
        return x;
    },
    writable: true,
    configurable: true
});

/**
    A utility to reduce unnecessary allocations of <code>function () {}</code>
    in its many colorful variations.  It does nothing and thus makes a suitable
    default in some circumstances.

    @function external:Function.noop
*/
Object.defineProperty(Function, "noop", {
    value: function () {
    },
    writable: true,
    configurable: true
});

/**
    A utility for creating a comparator function for a particular aspect of a
    figurative class of objects.

    @function external:Function.by
    @param {Function} relation A function that accepts a value and returns a
    corresponding value to use as a representative when sorting that object.
    @param {Function} compare an alternate comparator for comparing the
    represented values.  The default is <code>Object.compare</code>, which
    does a deep, type-sensitive, polymorphic comparison.
    @returns {Function} a comparator that has been annotated with
    <code>by</code> and <code>compare</code> properties so
    <code>Array#sorted</code> can perform a transform that reduces the need to
    call <code>by</code> on each sorted object to just once.
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
    writable: true,
    configurable: true
});

