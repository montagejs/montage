 /* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

var Montage = require("montage/core/core").Montage;

AnimationManager = exports.AnimationManager = Montage.create(Montage, {
    
    _animationDuration: {
        enumerable: false,
        value: 0
    },
    
    animationDuration: {
        enumerable: true,
        get: function() {
            return this._animationDuration;
        },
        set: function(value) {
            this._animationDuration = value;
        }
    },
    
});
