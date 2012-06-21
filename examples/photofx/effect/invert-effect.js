/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Effect = require("effect/effect").Effect;

exports.InvertEffect = Montage.create(Effect, {

    applyEffect: {
        value: function(pixels, pixelCount) {
            var i;

            for (i = 0; i < pixelCount; i += 4) {
                pixels[i] = 255 - pixels[i];
                pixels[i+1] = 255 - pixels[i+1];
                pixels[i+2] = 255 - pixels[i+2];
            }
        }
    }

});
