/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var SliderTest = exports.SliderTest = Montage.create(Component, {

    "testSlider": { value:null },
    "sliderValue": { value:null },
    "testSlider2": { value:null },
    "sliderValue2": { value:null }

});


if (window.parent && typeof window.parent.loaded === "function") {
    window.parent.loaded();
}
