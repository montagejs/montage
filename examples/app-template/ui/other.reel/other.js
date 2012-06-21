/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

// and here's a bunch of requires just to show this requiring things and upping the count in the loader

require("montage/ui/condition.reel");
require("montage/ui/list.reel");
require("montage/ui/scroller.reel");
require("montage/ui/bluemoon/tabs.reel");
require("montage/ui/textarea.reel");
require("montage/ui/input-text.reel");

exports.Other = Montage.create(Component, {});
