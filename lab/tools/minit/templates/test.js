/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var TemplateBase = require("../lib/template-base.js").TemplateBase;
var childProcess = require('child_process');

exports.Template = Object.create(TemplateBase, {


    usage: {
        value: function() {
            return TemplateBase.usage.apply(this, arguments) + " <title>";
        }
    },


    processArguments: {
        value: function(args) {
            TemplateBase.processArguments.apply(this, arguments);
            this.variables.title = args[1];
            if (!this.variables.title) {
                this.variables.title = this.variables.name.replace(/(?:^|-)([^-])/g, function(_, g1) { return g1.toUpperCase() });
            }
        }
    },

    destination: {
        value: "../../../test/ui/"
    },

    finish: {
        value: function() {
            TemplateBase.finish.apply(this, arguments);
            console.log("Direct Link:");
            console.log("http://localhost:8081/m-js/test/run.html?spec=ui%2F" + this.variables.name + "-spec");
            childProcess.exec("open http://localhost:8081/m-js/test/run.html?spec=ui%2F" + this.variables.name + "-spec");
        }
    }

});
