/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Effect = require("effect/effect").Effect;

exports.DesaturateEffect = Montage.create(Effect, {

    applyEffect: {
        value: function(pixels, pixelCount) {
            var i = 0,
                average;

            for (i = 0; i < pixelCount; i += 4) {
                average = (pixels[i] + pixels[i+1] + pixels[i+2])/ 3;
                pixels[i] = average;
                pixels[i+1] = average;
                pixels[i+2] = average;
            }
        }
    }

});
