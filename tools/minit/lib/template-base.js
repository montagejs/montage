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

var fs = require("fs");
var Path = require("path");
var Mustache = require("./mustache");
var childProcess = require('child_process');


exports.TemplateBase = Object.create(Object.prototype, {

    usage: {
        value: function() {
            return "<name>";
        }
    },

    newWithNameAndOptions: {
        value: function(directory, options) {
            var newTemplate = Object.create(this);
            newTemplate.directory = directory;
            newTemplate.options = options;
            return newTemplate;
        }
    },

    directory: {
        value: null,
        writable: true
    },

    buildDir: {
        value: null,
        writable: true
    },

    variables: {
        value: {}
    },

    // The output destination relative to the package root
    destination: {
        value: null
    },

    process: {
        value: function(arguments) {
            this.processArguments(arguments);
            this.buildDir = Path.join(this.options.minitHome, "build", this.options.templateName);
            var path;
            childProcess.exec("rm -rf " + this.buildDir, function (error, stdout, stderr) {
                childProcess.exec("mkdir -p " + Path.join(this.options.minitHome, "build"), function (error, stdout, stderr) {
                    path = "cp -R " + this.directory + " " + this.buildDir;
                    childProcess.exec(path, function (error, stdout, stderr) {
                        if (error) {
                            console.log(error.stack);
                            console.log('Error code: '+error.code);
                            console.log('Signal received: '+error.signal);
                            return;
                        }
                        this.processDirectory(this.buildDir);
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }
    },

    finish: {
        value: function() {
            var path;
            if (!this.destination) {
                // destination is the working directory
                path = "mv " + this.buildDir + "/* .";
            } else {
                // otherwise relative to the package root
                path = "mv " + this.buildDir + "/* " + Path.join(this.options.packageHome, this.destination);
            }
            if (! this.options.dryRun) {
                childProcess.exec(path, function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                        process.exit(1);
                    }
                    console.log("Template expansion successful!");
                }.bind(this));
            }
        }
    },

    _finish: {
        value: function() {
            this.finish();
            childProcess.exec("rm -rf " + this.buildDir);
        }
    },

    processArguments: {
        value: function(args) {
            this.variables.name = args[0];
        }
    },

    processFiles: {
        value: function(filenames) {
            filenames.forEach(function(filename) {
                var stats = fs.statSync(filename);

                if (stats.isFile() && /\.(html|json|js|css|markdown)$/.test(filename)) {
                    this.processFile(filename);
                } else if (stats.isDirectory()) {
                    this.processDirectory(filename);
                } else {
                    //console.log("Warning: " + filename + " has unknown file type.");
                }
            }.bind(this));
        }
    },

    processDirectory: {
        value: function processDirectory(dirname) {
            this.processingNewFile(dirname);
            this.rename(dirname, function(dirname) {
                fs.readdir(dirname, function(err, filenames) {
                    if (err) throw err;
                    filenames = filenames.map(function(value){return Path.join(dirname, value);}); // grunf..
                    this.processFiles(filenames);
                    this.doneProcessingFile(dirname);
                }.bind(this));
            }.bind(this));
        }
    },

    _filesProcessed: {
        value: 0
    },

    processingNewFile: {
        value: function(filename) {
            this._filesProcessed++;
        }
    },

    doneProcessingFile: {
        value: function(filename) {
            this._filesProcessed--;
            if (this._filesProcessed === 0) {
                this._finish();
            }
        }
    },

    processFile: {
        value: function processFile(filename) {
            this.processingNewFile(filename);
            fs.readFile(filename, function(err, data) {
                if (err) throw err;

                data = data.toString();

                var newContents = this.applyTransform(data, this.variables);

                 fs.writeFile(filename, newContents, function (err) {
                    if (err) {
                        console.log("Error writing to " + filename + ".");
                    }
                    this.rename(filename, function(filename) {
                        this.doneProcessingFile(filename);
                        //console.log("Converted: " + filename);
                    });
                }.bind(this));
            }.bind(this));
        }
    },

    applyTransform: {
        value: function(content, vars) {
            return Mustache.render(content, vars);
        }
    },

    rename: {
        value: function(filename, callback) {
            var newName = filename.replace("__name__", this.variables.name),
                path = "mv " + filename + " " + newName;
            childProcess.exec(path, function (error, stdout, stderr) {
                //console.log(path);
                if (callback) {
                    callback.call(this, newName);
                }
            }.bind(this));
        }
    }

});
