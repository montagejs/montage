/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

var NativeInputRangeTest = exports.NativeInputRangeTest = Montage.create(Montage, {
    scroll: {value: null},
    nativeInputRange1: {value: null},
    nativeInputRange: {value: null},
    scroll_range: {value: null}
});