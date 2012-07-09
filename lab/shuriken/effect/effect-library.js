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

var Effect = require("effect/effect").Effect;
var EffectLoader = require("effect/effect-loader").EffectLoader;
var DefaultEffectRepository = require("default-effect-repository/default-effect-repository").DefaultEffectRepository;

EffectLibrary = exports.EffectLibrary = Montage.create(Montage, {

    _repositories: { value: {} },


    /**
	Register effect repository

    @function
	@param {String} name of the repository
	@param {Object} templates templated as { templateName : templateLocation }
    @returns {Effect}
    */

	// FIXME: check if names are unqiue
    registerEffectRepository: {
        value: function(name, templates) {
            this._repositories[name] = templates;
        }
    },

    /**
	Unregister effect repository

    @function
	@param {String} name of the repository
    @returns {Effect}
    */
    unregisterEffectRepository: {
        value: function(name) {
            this._repositories[name] = null;
        }
    },

    _registerDefaultRepositoryIfNeeded: {
        value: function() {
            var repository = "default";
            if (!this._repositories[repository]) {
                this.registerEffectRepository(repository,DefaultEffectRepository.templates);
			}
        }
    },

    /**
    Instanciate asynchronously an effect

    @function
	@param {String} repository name (optional), if no repository name is passed then the names including all repositories are returned.
	@param {Object} callback
    @returns {Effect}
    */
    effectNames: {
        get: function(repositoryName) {
            var templates;
			this._registerDefaultRepositoryIfNeeded();
            var keys = [];
			if (repositoryName) {
            	templates = this._repositories[repositoryName];
				keys = Object.keys(templates);
			} else {
            	Object.keys(this._repositories).forEach(function(repository) {
                	templates = this._repositories[repository];
                	keys = keys.concat(Object.keys(templates));
            	}, this);
			}
            return keys;
        }
    },

    /**
    Instanciate asynchronously an effect,
	The caller provides callback and get the loaded effect passed as argument.

    @function
	@param {String} name
	@param {Object} callback
    */

    effectWithName:  {
        value: function(name, callback) {
            var self = this;

            this._registerDefaultRepositoryIfNeeded();

            function effectLoaded(effect, userInfos) {
                callback(effect, userInfos);
            }

            var keys = Object.keys(this._repositories);
            if (keys) {
                keys.forEach(function(repository) {
                    var templates = this._repositories[repository];
                    var moduleId = templates[name];
                    if (moduleId) {
                        EffectLoader.loadEffect(effectLoaded, name, moduleId, templates.__builtin_templates, null);
                    }
                }, this);
            }
        }
    },

});
