/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

// and here's a bunch of requires just to show this requiring things and upping the count in the loader

require("montage/ui/condition.reel");
require("montage/ui/list.reel");
require("montage/ui/scrollview.reel");
require("montage/ui/slider.reel"),
require("montage/ui/tabs.reel");
require("montage/ui/textarea.reel");
require("montage/ui/textfield.reel");
require("montage/ui/toggle.reel");

exports.Other = Montage.create(Component, {});
