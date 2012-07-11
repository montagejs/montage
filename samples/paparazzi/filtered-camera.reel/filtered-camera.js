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

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    MutableEvent = require("montage/core/event/mutable-event").MutableEvent,
    EffectLibrary = require("shuriken/effect/effect-library").EffectLibrary,
    PaparazziRepository = require("filters/paparazzi-repository").PaparazziRepository,
    Promise = require("montage/core/promise").Promise,
    glUtil = require("gl-util").glUtil;

exports.FilteredCamera = Montage.create(Component, {
    canvas: {
        value: null
    },

    snapshotCanvas: {
        value: null
    },

    snapshotCtx: {
        value: null
    },

    previewCanvas: {
        value: null
    },

    previewCtx: {
        value: null
    },

    previewImage: {
        value: null
    },

    filters: {
        value: [],
        distinct: true
    },

    gl: {
        value: null
    },

    video: {
        value: null
    },

    stream: { // TODO: Need to track?
        value: null
    },

    texture: {
        value: null
    },

    vertexBuffer: {
        value: null
    },

    framebuffer: {
        value: null
    },

    identityMat: {
        value: mat4.identity()
    },

    invertedIdentityMat: {
        value:  null
    },

    projectionMat: {
        value: null
    },

    startTime: {
        value: 0
    },

    _filterIndex: {
        value: -1
    },

    filterIndex: {
        get: function() {
            return this._filterIndex;
        },
        set: function(value) {
            var self = this;
            if(!this.filters.length) {
                this._filterIndex = -1;
                this.filter = null;
                return;
            }
            this._filterIndex = (value + this.filters.length) % this.filters.length;
            this.filter = this.filters[this._filterIndex];
            this.needsDraw = true; // Force the camera to start drawing again, in case it's stalled
        }
    },

    filter: {
        value: null
    },

    mousestate: {
        value: null
    },

    useNextFilter: {
        value: function() {
            this.filterIndex = this._filterIndex + 1;
        }
    },

    usePrevFilter: {
        value: function() {
            this.filterIndex = this._filterIndex - 1;
        }
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.startTime = Date.now();
            this.projectionMat = mat4.create();

            this.invertedIdentityMat = mat4.identity();
            mat4.scale(this.invertedIdentityMat, [1, -1, 1]);

            try {
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
                window.URL = window.URL || window.webkitURL;

                navigator.getUserMedia({video:true}, function(stream) {
                    self.video.src = window.URL.createObjectURL(stream);
                    self.stream = stream;
                    self.video.play(); // Apparently this is important! Go figure!

                    // Attempting to prevent the fans on my Macbook from going wild
                    // every time I leave the page running in another space
                    document.addEventListener("webkitvisibilitychange", function() {
                        if(document.webkitHidden) {
                            console.log("Hidden! Pausing!");
                            self.video.pause();
                        } else {
                            console.log("Visible! Playing!");
                            self.video.play();
                        }
                    }, false);

                }, function() {
                    console.log("getUserMedia denied");
                });
            } catch (e) {
                console.log("getUserMedia failed:", e);
            }

            window.addEventListener("resize", function() {
                self.resizeCanvas();
            }, false);

            this.canvas.element.addEventListener("click", function(e) {
                self.handleClick(e);
            }, false);

            this.canvas.element.addEventListener("mousemove", function(e) {
                self.mousestate = {
                    offsetX: e.offsetX - (self.canvas.width / 2.0),
                    offsetY: e.offsetY - (self.canvas.height / 2.0)
                };
            }, false);
        }
    },

    handleGlready: {
        value: function() {
            var self = this;

            this.gl = this.canvas.gl;
            this.initGLTexture(this.gl);
            this.initGLBuffer(this.gl);
            this.initGLFramebuffer(this.gl, 640, 480);

            this.resizeCanvas();

            this.previewImage = new Image();
            this.previewImage.addEventListener("load", function() {
                self.initFilterList();
            }, false);
            this.previewImage.src = "./img/default-scene.png";

            this.filterIndex = this.filterIndex; // Force rebuild of shaders
        }
    },

    initFilterList: {
        value: function() {
            var self = this;
            EffectLibrary.registerEffectRepository("Paparazzi", PaparazziRepository.templates);

            var name, filterCount = 0, descriptions = PaparazziRepository.templates;

            for(name in descriptions) {
                filterCount++;
            }

            for(name in descriptions) {
                this.buildFilter(name, function(filter) {
                    self.filters.push(filter);

                    if(!self.filter) {
                        self.filterIndex = 0;
                        self.needsDraw = true;
                    }

                    if(self.filters.length == filterCount) {
                        // Once all of the filters are loaded, throw an event
                        var filtersLoadedEvent = document.createEvent("CustomEvent");
                        filtersLoadedEvent.initCustomEvent("filtersloaded", true, false, null);
                        self.dispatchEvent(filtersLoadedEvent);
                    }
                });
            }

            this.filterIndex = 0;
        }
    },

    handleClick: {
        value: function(event) {
            var location = event.offsetX / this.canvas.width;

            if(location < 0.3) {
                this.usePrevFilter();
            } else if(location > 0.7) {
                this.useNextFilter();
            }
        }
    },

    resizeCanvas: {
        value: function() {
            var gl = this.gl;

            if(!gl) { return; }

            this.canvas.width = this.element.offsetWidth;
            this.canvas.height = 480;
            mat4.perspective(45.0, this.canvas.width/this.canvas.height, 1.0, 1024.0, this.projectionMat);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    draw: {
        value: function() {
            var gl = this.gl;

            if(!gl || !this.filter) { return; }
            this.updateGLTexture(gl);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var video = this.video;
            var aspectRatio = video.videoWidth/video.videoHeight;

            var modelView = mat4.create();

            var nextFilter = this.nextFilter || this.filter;
            var prevFilter = this.prevFilter || this.filter;

            // Center view
            /*mat4.identity(modelView);
            mat4.scale(modelView, [aspectRatio, 1, 1]);
            mat4.translate(modelView, [0, 0, -2.5]);
            if(this.mousestate) {
                // Just for kicks :)
                mat4.rotateX(modelView, this.mousestate.offsetY / 3000);
                mat4.rotateY(modelView, this.mousestate.offsetX / 3000);
            }
            this.drawFilteredView(gl, this.filter, modelView, this.projectionMat);*/

            this.drawFilteredView(gl, this.filter, this.identityMat, this.identityMat);

            // Queue up the next draw
            this.needsDraw = true;
        }
    },

    drawFilteredView: {
        value: function(gl, filter, modelView, projectionMat) {
            if(!filter || !filter.shaderProgram) { return; }

            var shaderProgram = filter.shaderProgram;
            gl.useProgram(shaderProgram);

            // Bind the quad geometry
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

            gl.enableVertexAttribArray(shaderProgram.attribute.aPosition);
            gl.vertexAttribPointer(shaderProgram.attribute.aPosition, 3, gl.FLOAT, false, 20, 0);

            gl.enableVertexAttribArray(shaderProgram.attribute.aTexCoord);
            gl.vertexAttribPointer(shaderProgram.attribute.aTexCoord, 2, gl.FLOAT, false, 20, 12);

            var i, count = filter._textures.length;
            for (i = 0 ; i < count ; i++) {
                gl.activeTexture(gl.TEXTURE1 + i); //active texture0 is reserved by the camera
                gl.bindTexture(gl.TEXTURE_2D, filter._textures[i]);
            }

            // Bind the texture from the framebuffer
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            //This does not need to be done each frame
            gl.uniform1i(shaderProgram.uniform.uSampler, 0);

            // Set up matrices
            if(shaderProgram.uniform.uModelViewMatrix) {
                gl.uniformMatrix4fv(shaderProgram.uniform.uModelViewMatrix, false, modelView);
            }
            if(shaderProgram.uniform.uProjMatrix) {
                gl.uniformMatrix4fv(shaderProgram.uniform.uProjMatrix, false, projectionMat);
            }

            // Time. Because it's useful.
            if(shaderProgram.uniform.uTime) {
                gl.uniform1f(shaderProgram.uniform.uTime, (Date.now() - this.startTime)/1000.0);
            }

            // The inverse texture size can be useful for effects which require precise pixel lookup
            if(shaderProgram.uniform.uInverseTextureSize) {
                gl.uniform2f(shaderProgram.uniform.uInverseTextureSize, 1.0/this.camera.videoWidth, 1.0/this.videoHeight);
            }

            // Draw the Quad
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    },

    initGLTexture: {
        value: function(gl) {
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, null); // Stub in a texture till we get camera data
        }
    },

    updateGLTexture: {
        value: function(gl) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video);
        }
    },

    initGLBuffer: {
        value: function(gl) {
            // Define the geometry for the fullscreen quad
            // Note: X component on the texture coord has been flipped to intentionally mirror the image.
            var vertices = [
                -1.0,-1.0, 0.0,   1.0, 0.0,
                 1.0,-1.0, 0.0,   0.0, 0.0,
                -1.0, 1.0, 0.0,   1.0, 1.0,

                -1.0, 1.0, 0.0,   1.0, 1.0,
                 1.0,-1.0, 0.0,   0.0, 0.0,
                 1.0, 1.0, 0.0,   0.0, 1.0
            ];

            // Init the buffer
            this.vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        }
    },

    initGLFramebuffer: {
        value: function(gl, width, height) {
            // Color Buffer
            var fbTexture  = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, fbTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            // Frame Buffer
            this.framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture, 0);

            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            // Offscreen canvas used to write snapshot to
            this.snapshotCanvas = document.createElement("canvas");
            this.snapshotCanvas.width = width;
            this.snapshotCanvas.height = height;
            this.snapshotCtx = this.snapshotCanvas.getContext("2d");

            // Offscreen canvas used to write previews to
            this.previewCanvas = document.createElement("canvas");
            this.previewCanvas.width = width / 2.0;
            this.previewCanvas.height = height / 2.0;
            this.previewCtx = this.previewCanvas.getContext("2d");
        }
    },

    //TODO this is a little weird accepting filter, key, value when the handle methods
    // typically expect to only accept event/notification. Looks like this method is
    // doing double duty
    handleWillChange: {
        value: function(filter, key, symbol, value) {

            if (!filter.shaderProgram)
                return;

            var type = filter.inputs[key].type;

            var location = filter.shaderProgram.uniform[symbol];
            if (!location)
                return;

            var gl = this.gl;
            var deferred = Promise.defer();

            // I think that we need to do this here instead of filterDidChange so that
            // if handleInputParameterChange is called directly we bind the right program
            //gl.useProgram(filter.shaderProgram);

            //that could obviously be more efficient...
            if (type === "vec4") {  //FIXME:assume array
                gl.uniform4fv(location, value);
                deferred.resolve();
            } else if (type === "vec3") {
                gl.uniform3fv(location, value);
                deferred.resolve();
            } else if (type == "path") {
                var img = new Image();
                var self = this;

                var texture = gl.createTexture();
                texture.image = new Image();
                texture.image.onload = function() {
                    var textureNb = filter._textures.length + 1; //index 0 is reserved by camera
                    gl.activeTexture(gl.TEXTURE0 + textureNb);

                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    filter._textures.push(texture);

                    gl.useProgram(filter.shaderProgram);
                    gl.uniform1i(location, textureNb);

                    deferred.resolve();
                };
                texture.image.src = value;
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        }
    },

    _getSourceFromScript: {
        value: function(script) {
            var str = null;

            if (script) {
                str = "";
                var k = script.firstChild;
                while (k) {
                    if (k.nodeType == 3) {
                        str += k.textContent;
                    }
                    k = k.nextSibling;
                }
            }
            return str;
        }
    },

    filterDidChange: {
        value: function(filter, callback) {
            var gl = this.gl;
            var promises = [];

            if(!filter.profiles.GLSL) {
                console.error("Cannot use filters without a GLSL profile");
                return;
            }

            var pass = null;
            var glsl = filter.profiles.GLSL;
            var techniques = glsl.techniques;

            if (techniques) {
                techniqueNames = Object.keys(techniques);
                if (techniqueNames.length) {
                    //FIXME: for now strictly assume  one technique and one pass.
                    var techniqueName = techniqueNames[0];
                    var passes = techniques[techniqueName];
                    var passNames = Object.keys(passes);

                    pass = passes[passNames[0]];

                    filter.shaderProgram = glUtil.createShaderProgram(gl, 	this._getSourceFromScript(pass["x-shader/x-vertex"]),
                                                                            this._getSourceFromScript(pass["x-shader/x-fragment"]));

                    // Use the Post Process shader right after having created it (so that we are ready to set uniform default values)
                    gl.useProgram(filter.shaderProgram);
                    filter._textures = [];
                }
            }
            if (pass) {
                var keys = filter.inputKeys;
                if (keys) {
                    keys.forEach( function(key) {
                        var glslInputs = pass.inputs;
                        if (glslInputs) {
                            symbol = glslInputs[key].symbol;
                            if (!symbol)
                                symbol = key; //if no symbol, let's assume that symbol == key
                            }

                            var value, parameter;
                            parameter = filter.inputs[key];
                            promises.push(this.handleWillChange(filter, key, symbol, parameter.value));
                    }, this);
                }
            }

            if(callback) {
                Promise.all(promises).then(callback);
            }

            this.needsDraw = true;
        }
    },

    buildFilter: {
        value: function(name, callback) {
            var gl = this.gl;

            if(!gl) { return; }
            var self = this;

            EffectLibrary.effectWithName(name, function(filter) {
                filter.name = name;

                self.filterDidChange(filter, function() {
                    filter.previewSrc = self.getFilterPreviewURL(self.previewImage, filter);
                    if(callback) { callback(filter); }
                });
            });
        }
    },

    getFilterPreviewURL: {
        value: function(image, filter) {
            var gl = this.gl;

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

            var width = this.previewCanvas.width;
            var height = this.previewCanvas.height;

            var imageData = this.previewCtx.createImageData(width, height);
            var pixelData = new Uint8Array(width * height * 4);

            // Render filtered image to offscreen buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.viewport(0, 0, width, height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // Fun fact: When we do the pixel copy below, the image actually comes down upside down!
            // Hence we use an identity matrix with an inverted Y axis to give us a picture that eventually
            // will come out right side up
            this.drawFilteredView(gl, filter, this.invertedIdentityMat, this.identityMat);
            gl.finish(); // TODO: Needed?
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);

            // Wait... seriously? I have to do THIS?!?
            var i;
            for(i = 0; i < pixelData.length; ++i) {
                imageData.data[i] = pixelData[i]; // Ffffuuuuuuuuuuuu....
            }

            this.previewCtx.putImageData(imageData, 0, 0);

            return this.previewCanvas.toDataURL();
        }
    },

    getSnapshotURL: {
        value: function() {
            var gl = this.gl;

            this.updateGLTexture(gl);

            var width = this.snapshotCanvas.width;
            var height = this.snapshotCanvas.height;

            var imageData = this.snapshotCtx.createImageData(width, height);
            var pixelData = new Uint8Array(width * height * 4);

            // Render filtered image to offscreen buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.viewport(0, 0, width, height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // Fun fact: When we do the pixel copy below, the image actually comes down upside down!
            // Hence we use an identity matrix with an inverted Y axis to give us a picture that eventually
            // will come out right side up
            this.drawFilteredView(gl, this.filter, this.invertedIdentityMat, this.identityMat);
            gl.finish(); // TODO: Needed?
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);

            // Wait... seriously? I have to do THIS?!?
            var i;
            for(i = 0; i < pixelData.length; ++i) {
                imageData.data[i] = pixelData[i]; // Ffffuuuuuuuuuuuu....
            }

            this.snapshotCtx.putImageData(imageData, 0, 0);

            return this.snapshotCanvas.toDataURL();
        }
    }
});
