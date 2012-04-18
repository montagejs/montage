/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var fs = require("fs");
var Mustache = require("./mustache");
var childProcess = require('child_process');


exports.TemplateBase = Object.create(Object.prototype, {

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

    destination: {
        value: "../../../"
    },

    process: {
        value: function(arguments) {
            this.processArguments(arguments);
            this.buildDir = this.options.minitHome + "build/" + this.options.templateName;
            var path;
            childProcess.exec("rm -rf " + this.buildDir, function (error, stdout, stderr) {
                path = "cp -R " + this.directory + " " + this.buildDir;
                //console.log(path);
                childProcess.exec(path, function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                    }
                    this.processDirectory(this.buildDir);
                }.bind(this));
            }.bind(this));
        }
    },

    finish: {
        value: function() {
            var path = "cp -R " + this.buildDir + "/ " + this.options.minitHome + "/" + this.destination;
            //console.log(path);
            if (! this.options.dryRun) {
                childProcess.exec(path, function (error, stdout, stderr) {
                    if (error) {
                        console.log(error.stack);
                        console.log('Error code: '+error.code);
                        console.log('Signal received: '+error.signal);
                    }
                    console.log("Template expansion successful!");
                }.bind(this));
            }
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

                if (stats.isFile() && /\.(html|json|js|css)$/.test(filename)) {
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
            this.rename(dirname, function(dirname) {
                fs.readdir(dirname, function(err, filenames) {
                    if (err) throw err;
                    filenames = filenames.map(function(value){return dirname+"/"+value}); // grunf..
                    this.processFiles(filenames);
                }.bind(this));
            }.bind(this))
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
                this.finish();
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

                if (this.options.dryRun) {
                    console.log("Will rewrite " + filename + " with:");
                    console.log(newContents);
                    this.doneProcessingFile(filename);
                } else {
                    fs.writeFile(filename, newContents, function (err) {
                        if (err) {
                            console.log("Error writing to " + filename + ".");
                        }
                        this.rename(filename, function(filename) {
                            this.doneProcessingFile(filename);
                            //console.log("Converted: " + filename);
                        });
                    }.bind(this));
                }
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
            var newName = filename.replace("__name__", this.variables.name);
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