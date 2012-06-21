/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
    @module "montage/ui/select.reel"
*/
/*global require,exports */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeSelect = require("ui/native/select.reel").Select;

/**
 * Select
 * @class module:"montage/ui/select.reel".Select
 * @extends module:"montage/ui/native/select.reel".Select
 */
exports.Select = Montage.create(NativeSelect, /** @lends module:"montage/ui/select.reel".Select# */ {

    hasTemplate: {value: true},

    didSetElement: {
        value: function() {
            NativeSelect.didSetElement.call(this);
            this['class'] = (this['class'] || '') + ' montage-select';
        }
    }


});