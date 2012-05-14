/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var TemplateBase = require("../lib/template-base.js").TemplateBase;
    path = require("path");

exports.Template = Object.create(TemplateBase, {
    usage: {
        value: function() {
            return TemplateBase.usage.apply(this, arguments) + " <author> <montage path>";
        }
    },

    processArguments: {
        value: function(args) {
            TemplateBase.processArguments.apply(this, arguments);
            this.variables.author = args[1];
            this.variables.montagePath = args[2];
            if (!path.existsSync(path.join(this.variables.montagePath, "montage.js"))) {
                console.error("Error: " + path.join(this.variables.montagePath, "montage.js") + " does not exist. Exiting.");
                process.exit();
            }
        }
    },

});
