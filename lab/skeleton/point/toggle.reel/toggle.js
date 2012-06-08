/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;    

/**
 * Toggle
 */
var Toggle = exports.Toggle = Montage.create(Component, {
    
    prepareForDraw: {
        value: function() {
            // Just temporary to test, should probably work on whole element.
            this._element.addEventListener("click", function(event) {
                this.classList.toggle("isChecked");
            }, true);
        }
    }
    
});
