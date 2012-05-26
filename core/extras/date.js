/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    Defines extensions to intrinsic <code>Date</code> object.
    @see [Date class]{@link external:Date}
    @module montage/core/extras/date
*/

/**
    @external
*/

/**
    Creates a copy of a date.

    @function external:Date#clone
    @returns {Date} a new date
*/
Object.defineProperty(Date.prototype, "clone", {
    value: function () {
        return new Date(this);
    },
    writable: true,
    configurable: true
});

/**
    Creates a copy of a date.

    @function external:Date#clone
    @returns {Date} a new date
*/
Object.defineProperty(Date.prototype, "deepClone", {
    value: Date.prototype.clone,
    writable: true,
    configurable: true
});

