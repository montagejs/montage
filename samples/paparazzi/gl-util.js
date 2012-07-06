/*
 * Copyright (c) 2011 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

(function(exports) {
    "use strict";

    var glUtil = exports.glUtil = {
        getContext: function(canvas) {
            var context;
        
            if (canvas.getContext) {
                try {
                    context = canvas.getContext('webgl');
                    if(context) { return context; }
                } catch(ex) {}
            
                try {
                    context = canvas.getContext('experimental-webgl');
                    if(context) { return context; }
                } catch(ex) {}
            }
        
            return null;
        },
    
        showGLFailed: function(element) {
            var errorElement = document.createElement("div");
            var errorHTML = "<h3>Sorry, but a WebGL context could not be created</h3>";
            errorHTML += "Either your browser does not support WebGL, or it may be disabled.<br/>";
            errorHTML += "Please visit <a href=\"http://get.webgl.org\">http://get.webgl.org</a> for ";
            errorHTML += "details on how to get a WebGL enabled browser.";
            errorElement.innerHTML = errorHTML;
            errorElement.id = "gl-error";
            element.parentNode.replaceChild(errorElement, element);
        },
    
        createShaderProgram: function(gl, vertexShader, fragmentShader) {
            var shaderProgram = gl.createProgram(),
                vs = this._compileShader(gl, vertexShader, gl.VERTEX_SHADER),
                fs = this._compileShader(gl, fragmentShader, gl.FRAGMENT_SHADER);

            gl.attachShader(shaderProgram, vs);
            gl.attachShader(shaderProgram, fs);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                gl.deleteProgram(shaderProgram);
                gl.deleteShader(vs);
                gl.deleteShader(fs);
                return null;
            }

            var i, attrib, uniform;
            var attribCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
            shaderProgram.attribute = {};
            for (i = 0; i < attribCount; i++) {
                attrib = gl.getActiveAttrib(shaderProgram, i);
                shaderProgram.attribute[attrib.name] = gl.getAttribLocation(shaderProgram, attrib.name);
            }

            var uniformCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
            shaderProgram.uniform = {};
            for (i = 0; i < uniformCount; i++) {
                uniform = gl.getActiveUniform(shaderProgram, i);
                shaderProgram.uniform[uniform.name] = gl.getUniformLocation(shaderProgram, uniform.name);
            }

            return shaderProgram;
        },

        _compileShader: function(gl, source, type) {
            var shader = gl.createShader(type);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.debug(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        },

        getSourceFromId: function(gl, id) {
            var script = document.getElementById(id);
            if (!script) {
                return null;
            }

            var str = "";
            var k = script.firstChild;
            while (k) {
                if (k.nodeType == 3) {
                    str += k.textContent;
                }
                k = k.nextSibling;
            }

            return str;
        },
    
        createSolidTexture: function(gl, color) {
            var data = new Uint8Array(color);
            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            return texture;
        },
    
        loadTexture: function(gl, src, callback) {
            var texture = gl.createTexture();
            var image = new Image();
            image.addEventListener("load", function() {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                gl.generateMipmap(gl.TEXTURE_2D);
            
                if(callback) { callback(texture); }
            });
            image.src = src;
            return texture;
        }
    };
})((typeof(exports) != 'undefined') ? exports : window);