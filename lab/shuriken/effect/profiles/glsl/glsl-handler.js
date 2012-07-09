/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var Montage = require("montage/core/core").Montage;

//Currently investigating issues with map, use naive replacement for the moment
var Map = require("montage/core/shim/structures").Map;
var EffectHandler = require("effect/effect-handler").EffectHandler;
var Effect = require("effect/effect").Effect;
var GLSLProgram = require("effect/profiles/glsl/glsl-program").GLSLProgram;

GLSLHandler = exports.GLSLHandler = Montage.create(Montage, {

    // reference to GL here to be removed hopefully in the future
    _GL: {
        enumerable: false,
        value: null
    },

    GL: {
        enumerable: false,
        get: function() {
            return this._GL;
        },
        set: function(value) {
            this._GL = value;
        }
    },

    //TODO: refactor
	getSourceFromScript: {
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

    forEachGLSLPass: {
        value: function(effect, callback) {
            var techniqueNames = null;
            var symbol = null;

            if (effect.profiles) {
                if (effect.profiles.GLSL) {
	                var glsl = effect.profiles.GLSL;
                    var techniques = glsl.techniques;

                    if (techniques) {
                        techniqueNames = Object.keys(techniques);

                        if (techniqueNames.length) {
                            //FIXME for now, assume only one technique.
                            var techniqueName = techniqueNames[0];
                            var passes = techniques[techniqueName];
                            var passNames = Object.keys(passes);

                            passNames.forEach( function(passName) {
                                if (callback)
                                    callback(techniqueName, passes[passNames]);
                            }, this);
                        }
                    }
                }
            }
        }
    },

    _EffectToGLSLProgram: {
        enumerable: false,
        value: null
    },

    EffectToGLSLProgram: {
        enumerable: false,
        get: function() {
            return this._EffectToGLSLProgram;
        },
        set: function(value) {
            this._EffectToGLSLProgram = value;
        }
    },

    _createEffectToGLSLProgramIfNeeded: {
        enumerable: false,
        value: function() {
            if (!this.EffectToGLSLProgram) {
              this.EffectToGLSLProgram = new Map();
            }
        }
    },

    GLSLProgramForEffect: {
        enumerable: false,
        value: function(effect,createIfAbsent) {
            var self = this;

            if ((typeof createIfAbsent === "undefined") || (createIfAbsent === null))
                createIfAbsent = true;
            this._createEffectToGLSLProgramIfNeeded();
            var glslProgram = this.EffectToGLSLProgram.get(effect);
            if (!glslProgram && createIfAbsent) {
				//glslProgram = RDGEBridge.convert(effect);


                this.forEachGLSLPass(effect, function(techniqueName, pass) {
                    var vertexShader = self.getSourceFromScript(pass["x-shader/x-vertex"]);
                    var fragmentShader = self.getSourceFromScript(pass["x-shader/x-fragment"]);

                    var prog = Montage.create(GLSLProgram);
                    prog.initWithShaders({"x-shader/x-vertex" : vertexShader , "x-shader/x-fragment" : fragmentShader });
                    prog.build(self.GL);

                    //FIXME: demo code, only work for one pass
                	self.EffectToGLSLProgram.set(effect, prog);
                    glslProgram = prog;
                });
            }

            return glslProgram;
        }
    },

    unregisterEffect: {
        enumerable: false,
        value: function(effect) {
            if (this.EffectToJShader) {
                //FIXME: consider calling a destroyGPUObject function to free GL resource immediately
				this.EffectToJShader.delete(effect);
            }
        }
    },

    _setInputParameterValue: {
        value: function(effect, technique, key, symbol) {
            var glslProgram = null;
            var parameter = effect.inputs[key];

            //symbol to update the glsl shader
            var type = parameter.type;
            var value = parameter.animatedValue;

            if (!symbol) {
                symbol = key;
            }

            glslProgram = this.GLSLProgramForEffect(effect, true);
            glslProgram.setValueForSymbol(symbol,value);
            glslProgram.use(this.GL);
        }
    },

    //inefficient for now, pass to paramters should be cached
    setInputParameterValue: {
        value: function(effect, key, value) {
            var self = this;

            this.forEachGLSLPass(effect, function(techniqueName, pass) {

                var glslInputs = pass.inputs;
                if (glslInputs) {
                    symbol = glslInputs[key].symbol;
                }

                self._setInputParameterValue(effect, techniqueName, key, symbol ? symbol : key);
            });
        }
    },

    handleEvent: {
        value: function(event) {

			var effect = event.target;
            var pathComponents = event.propertyPath.split(".");
             if (pathComponents.length === 3) {
                var key = pathComponents[1];
                var value = effect.inputs[key].value;

                this.setInputParameterValue(effect, key, value);

            } else {
                console.log("WARNING: unexepected path");
            }
        }
    },

    //TODO: refactor
    unbindEffect: {
        value: function(effect) {
            this.unregisterEffect(effect);

            var keys = effect.inputKeys;

            keys.forEach(function(key) {
                var path = "change@inputs"+key+".animatedValue";
                effect.removeEventListener(path, this, false);
            }, this);

        }
    },

    //TODO: refactor
    bindEffect: {
        value: function(effect) {
            var keys = effect.inputKeys;

            //setup default values
            keys.forEach(function(key) {
                var value = effect.inputs[key].value;
                if ((typeof value !== "undefined") && (value !== null))
                	this.setInputParameterValue(effect, key, value);
            }, this);

            //bind values
            keys.forEach(function(key) {
                var path = "change@inputs."+key+".animatedValue";
                effect.addEventListener(path, this, false);
            }, this);

        }
    },

});
