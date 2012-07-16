/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var TemplateBase = require("../lib/template-base.js").TemplateBase;
var childProcess = require('child_process'),
    fs = require('fs');

var _firstCapRe = new RegExp('(.)([A-Z][a-z]+)'),
    _allCapRe = new RegExp('([a-z0-9])([A-Z])'),
    _fromCamelToDashes = function (name){
        var s1 = name.replace(_firstCapRe, "$1-$2");
        return s1.replace(_allCapRe, "$1-$2").toLowerCase();
    };

exports.Template = Object.create(TemplateBase, {

    usage: {
        value: function() {
            return TemplateBase.usage.apply(this, arguments) + " [jsdoc module] [copyright file]";
        }
    },


    processArguments: {
        value: function(args) {
            TemplateBase.processArguments.apply(this, arguments);

            // We accept the name in any format, dashed, spaced or camelcased
            // We then convert to to camelcase and back to get the consistent
            // naming used in Montage
            var name = this.variables.name;
            // remove spaces
            name = name.replace(" ", "-");
            // convert to camelcase
            var exportedName = name.replace(/(?:^|-)([^\-])/g, function(_, g1) { return g1.toUpperCase(); });
            // convert back from camelcase to dashes
            name = _fromCamelToDashes(exportedName);

            var jsdocModule = args[1];
            if (jsdocModule && jsdocModule.length && jsdocModule.substring(jsdocModule.length - 1) !== "/") {
                jsdocModule += "/";
            }

            var copyright, copyrightFile = args[2];
            if (copyrightFile) {
                copyright = fs.readFileSync(copyrightFile, "utf-8");
            }

            this.variables.name = name;
            this.variables.exportedName = exportedName;
            this.variables.jsdocModule = jsdocModule;
            this.variables.copyright = copyright;
        }
    },

    destination: {
        value: "ui"
    },

    finish: {
        value: function() {
            TemplateBase.finish.apply(this, arguments);
            console.log(this.variables.name + ".reel created.");
        }
    }

});
