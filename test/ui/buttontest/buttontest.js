/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Button = require("montage/ui/bluemoon/button.reel").Button;

var ButtonTest = exports.ButtonTest = Montage.create(Montage, {
  handleAction: {
    value: function() {
      this.output.value += "pressed ";
    }
  }
});
