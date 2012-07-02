/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var TemplateBase = require("../lib/template-base.js").TemplateBase,
    path = require("path"),
    exec = require('child_process').exec;

exports.Template = Object.create(TemplateBase, {

    finish: {
        value: function() {
            TemplateBase.finish.call(this);

            // TODO: Do something automatically
            // This is nowhere near the most user friendly way of adding Montage
            // to the user's app. We could init a Git repo and submodule it
            // for them, but that might be a bit presumptuous. To think about.
            console.log("* Clone Montage to your app:");
            console.log("git clone git@github.com:Motorola-Mobility/montage.git "+ this.variables.name +"/node_modules/montage");
            console.log("* or add it as a submodule:");
            console.log("cd " + this.variables.name);
            console.log("git init");
            console.log("git submodule add git@github.com:Motorola-Mobility/montage.git node_modules/montage");
            console.log();
        }
    }

});
