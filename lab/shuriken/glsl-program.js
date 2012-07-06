//TODO: save/restore currentProgram before using GL.useProgram(this.program);
//TODO: Delete shader if compile failed
//TODO: Delete program if LINK failed

var Montage = require("montage/core/core").Montage;
GLSLProgram = exports.GLSLProgram = Montage.create(Montage, {
    
    
    VERTEX_SHADER: {   enumerable: false,  get: function() {   return "x-shader/x-vertex"; }, },
    FRAGMENT_SHADER: {   enumerable: false,  get: function() {   return "x-shader/x-fragment"; }, },

    VERTEX: {   enumerable: false,  get: function() {   return "VERTEX";    },  },
    NORMAL: {   enumerable: false,  get: function() {   return "NORMAL";    },  },
    UV_0: {   enumerable: false,  get: function() {   return "UV_0";    },  },
    MODELVIEW_MATRIX: {   enumerable: false,  get: function() {   return "MODELVIEW_MATRIX";    },  },
    PROJECTION_MATRIX: {   enumerable: false,  get: function() {   return "PROJECTION_MATRIX";    },  },
    MODELVIEW_PROJECTION_MATRIX: {   enumerable: false,  get: function() {   return "MODELVIEW_PROJECTION_MATRIX";    },  },

    //FIXME: shaders should be private
    _shaders:
    {
        enumerable: false,
        value: []
    },
    
    shaders: {
        enumerable: false,
        get: function() {
            return this._shaders;
        },
        set: function(value) {
            this._shaders = value;
        }
    },

    _errorLogs:
    {
        enumerable: false,
        value: []
    },
    
    errorLogs: {
        enumerable: false,
        get: function() {
            return this._errorLogs;
        },
        set: function(value) {
            this._errorLogs = value;
        }
    },

    _pendingCommits:
    {
        enumerable: false,
        value: []
    },
    
    pendingCommits: {
        enumerable: false,
        get: function() {
            return this._pendingCommits;
        },
        set: function(value) {
            this._pendingCommits = value;
        }
    },

    _symbolToLocation:
    {
        enumerable: false,
        value: {}
    },
    
    symbolToLocation: {
        enumerable: false,
        get: function() {
            return this._symbolToLocation;
        },
        set: function(value) {
            this._symbolToLocation = value;
        }
    },
    
    _symbolToActiveInfo:
    {
        enumerable: false,
        value: {}
    },
    
    symbolToActiveInfo: {
        enumerable: false,
        get: function() {
            return this._symbolToActiveInfo;
        },
        set: function(value) {
            this._symbolToActiveInfo = value;
        }
    },
    
    _semanticToSymbol: {
        enumerable: false,
        value: {}
    },
    
    semanticToSymbol: {
        enumerable: false,
        get: function() {
            return this._semanticToSymbol;
        },
        set: function(value) {
            this._semanticToSymbol = value;
        }
    },

    _symbolToSemantic: {
        enumerable: false,
        value: {}
    },
    
    symbolToSemantic: {
        enumerable: false,
        get: function() {
            return this._symbolToSemantic;
        },
        set: function(value) {
            this._symbolToSemantic = value;
        }
    },

    _symbolToValue:
    {
        enumerable: false,
        value: {}
    },
    
    symbolToValue: {
        enumerable: false,
        get: function() {
            return this._symbolToValue;
        },
        set: function(value) {
            this._symbolToValue = value;
        }
    },
        
    _uniformSymbols:
    {
        enumerable: false,
        value: []
    },
    
    uniformSymbols: {
        enumerable: false,
        get: function() {
            return this._uniformSymbols;
        },
        set: function(value) {
            this._uniformSymbols = value;
        }
    },

    _attributeSymbols:
    {
        enumerable: false,
        value: []
    },
    
    attributeSymbols: {
        enumerable: false,
        get: function() {
            return this._attributeSymbols;
        },
        set: function(value) {
            this._attributeSymbols = value;
        }
    },


    _GLProgram:
    {
        enumerable: false,
        value: null
    },
        
    //API        
    GLProgram: {
        enumerable: false,
        get: function() {
            return this._GLProgram;
        },
        set: function(value) {
            this._GLProgram = value;
        }
    },
        
	getTypeForSymbol: {
        value: function(symbol) {	
            var type = null;
            var activeInfo = this.symbolToActiveInfo[symbol];
            if (activeInfo) {
                type = activeInfo.type;
            }
            return type;
        }
	},

	getLocationForSymbol: {
        value: function(symbol) {	
            return this.symbolToLocation[symbol];
        }
	},

	
	getSymbolForSemantic: {
        value: function(semantic) {	
            return this.semanticToSymbol[semantic];
        }
	},
	  
    //FIXME: argument order should be reversed
    setSymbolForSemantic: {
        value: function(symbol,semantic)  {
            if (symbol === "none")
                symbol = null;
            if (semantic === "none")
                semantic = null;

            if (!this.symbolToActiveInfo[symbol]) {
                return false;
            }

            //if the semantic is already taken bail out.
            if (semantic) {
                if (this.semanticToSymbol[semantic]) {
                    return false;
                }
            }

            if (symbol) {
                var previousSemantic = this.symbolToSemantic[symbol];
                if ((previousSemantic) && (previousSemantic !== semantic)) {
                    this.semanticToSymbol[previousSemantic] = null;
                } 
                
                this.symbolToSemantic[symbol] = semantic;
            }

            if (semantic) {
                this.semanticToSymbol[semantic] = symbol;
            }
            
            return true;
        }
	},
    
    setSemanticForSymbol: {
        value: function(symbol,semantic)  {
            this.setSymbolForSemantic(symbol,semantic);
        }
    },

	getSemanticForSymbol: {
        value: function(symbol) {	
            return this.symbolToSemantic[symbol];
        }
	},

	setValueForSymbol: {
        value: function(symbol,value)  {
            if (this.symbolToActiveInfo[symbol] !== null) {
                if (this.pendingCommits.indexOf(symbol) === -1) {
                    this.pendingCommits.push(symbol);
                }
            }
            this.symbolToValue[symbol] = value;
        }
	},
	
	getValueForSymbol: {
        value: function(symbol) {
            return this.symbolToValue[symbol];
        }
	},
	
    //that should be private
	commit: {
        value: function(GL) {
            var i = 0, count = this.pendingCommits.length;
            for (i = 0 ; i < count ; i++) {
                var symbol = this.pendingCommits[i];
                var type = this.getTypeForSymbol(symbol);
                var location = GL.getUniformLocation(this.GLProgram,symbol); 
                var value = this.getValueForSymbol(symbol);
			
                switch (type) {
                    case GL.FLOAT_MAT2:
                        GL.uniformMatrix2fv(location , false, value);
                        break;
                    case GL.FLOAT_MAT3:
                        GL.uniformMatrix3fv(location , false, value);
                        break;
                    case GL.FLOAT_MAT4:
                        GL.uniformMatrix4fv(location , false, value);
                        break;
                    case GL.FLOAT:
                        GL.uniform1f(location,value);
                        break;
                    case GL.FLOAT_VEC3:
                        GL.uniform3fv(location,value);
                        break;
                    case GL.FLOAT_VEC4:
                        GL.uniform4fv(location,value);
                    break;
					
                }
            }
            this.pendingCommits = [];
        }
    },
	
    use: {
        value: function(GL) { 
        
            GL.useProgram(this.GLProgram);        

            this.commit(GL);
        }
    },
    
    //that should be private
	createShaderWithSourceAndType: {
        value: function createShaderWithSourceAndType(GL,shaderSource,shaderType) {
            var shader;
            if (shaderType === "x-shader/x-fragment") {
                shader = GL.createShader(GL.FRAGMENT_SHADER);
            } else if (shaderType === "x-shader/x-vertex") {
                shader = GL.createShader(GL.VERTEX_SHADER);
            } else {
                return null;
            }

            GL.shaderSource(shader, shaderSource);
            GL.compileShader(shader);

            if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
                this.errorLogs = GL.getShaderInfoLog(shader);
                return null;
            }
		
            return shader;
        }
    },
    
	build: {   
        value: function(GL) {
            var i;
            var vertexShaderSource = this.shaders["x-shader/x-vertex"];
            var fragmentShaderSource = this.shaders["x-shader/x-fragment"];
            
            var buildSuccess = false;
            
            var vertexShader = this.createShaderWithSourceAndType(GL,vertexShaderSource,"x-shader/x-vertex");
            if (vertexShader === null)
                return false;
            
            var fragmentShader = this.createShaderWithSourceAndType(GL,fragmentShaderSource,"x-shader/x-fragment");
            if (fragmentShader === null)
                return false;

            this.GLProgram = GL.createProgram();

            GL.attachShader(this.GLProgram, vertexShader);
            GL.attachShader(this.GLProgram, fragmentShader);

            GL.linkProgram(this.GLProgram);
            if (GL.getProgramParameter(this.GLProgram, GL.LINK_STATUS)) {
                
                this.pendingCommits = [];		
                this.symbolToActiveInfo = {};
                this.symbolToValue = {};
                this.uniformSymbols = [];
                this.attributeSymbols = [];
                this.symbolToSemantic = {};
                this.semnaticToSymbol = {};
                
                GL.useProgram(this.GLProgram);
                
                var uniformsCount = GL.getProgramParameter(this.GLProgram,GL.ACTIVE_UNIFORMS);
                for (i = 0 ; i < uniformsCount ; i++) {
                    var activeInfo = GL.getActiveUniform(this.GLProgram, i);
                    this.symbolToActiveInfo[activeInfo.name] = activeInfo;
                    //WebGLUniformLocation getUniformLocation(WebGLProgram program, DOMString name);
                    this.symbolToLocation[activeInfo.name] = GL.getUniformLocation(this.GLProgram,activeInfo.name);    
                    this.uniformSymbols.push(activeInfo.name);
                    //alert(""+activeInfo.name+":"+this.symbolToLocation[activeInfo.name])
                }
                
                var attributesCount = GL.getProgramParameter(this.GLProgram,GL.ACTIVE_ATTRIBUTES);
                for (i = 0 ; i < attributesCount ; i++) {
                    var activeInfo = GL.getActiveAttrib(this.GLProgram, i);
                    this.symbolToActiveInfo[activeInfo.name] = activeInfo;
                    //GLint getAttribLocation(WebGLProgram program, DOMString name);
                    this.symbolToLocation[activeInfo.name] = GL.getAttribLocation(this.GLProgram,activeInfo.name);    
                    this.attributeSymbols.push(activeInfo.name);
                    //alert(""+activeInfo.name+":"+this.symbolToLocation[activeInfo.name])
                }

                buildSuccess = true;
            }
            this.errorLogs = GL.getProgramInfoLog(this.GLProgram);
            
            return buildSuccess;
        }
    },

	initWithShaders: {
        value: function(shaders) {   
            this.shaders = shaders;
        }
    },

    initWithProgram: {
        value: function(program) {
            this.shaders = program.shaders;
            this.semanticToSymbol = program.semanticToSymbol;
            this.symbolToSemantic = program.symbolToSemantic;
        }
    }

});

