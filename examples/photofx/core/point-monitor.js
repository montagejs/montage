/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

exports.PointMonitor = Montage.create(Montage, {

    color: {
        value: null,
        serializable: true
    },

    x: {
        serializable: true,
        value: null
    },

    y: {
        serializable: true,
        value: null
    }

});
