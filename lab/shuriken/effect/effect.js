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
var AnimationManager = require("animation/animation-manager").AnimationManager;
var Template = require("montage/ui/template").Template;

// FIXME:This should be in its own class
var SimpleAnimation = Montage.create(Montage, {

    _path: { value: null },
    _type: { value: null },
    _startValue: { value: null },
    _endValue: { value: null },
    _context: { value: null },
    _delegate: { value: null },
    _duration: { value: 0 },
    _startTime: { value: 0 },
    _intervalRequest: { value: 0 },

    init: {
        value: function(path, type, startValue, endValue, duration, context, delegate) {
            this._type = type;
            this._startValue = startValue;
            this._endValue = endValue;
            this._context = context;
            this._delegate = delegate;
            this._duration = duration;
            this._path = path;
        }
    },

    handleUpdate: {
        value: function() {
            var date = new Date();
            var time = date.getTime() / 1000.0;
            var t = (time - this._startTime) / ((this._duration) );

            // console.log("handle update t:"+t);
            // console.log("time:"+time+" startTime:"+this._startTime+" duration:"+this._duration);
            if (this._delegate) {
                var interpolatedValue;

                if (this._type === "vec4") {
                    //todo add backend for interpolations
                    interpolatedValue = [0 ,0, 0, 0];

                    interpolatedValue[0] = ((1 - t) * this._startValue[0]) + (t * this._endValue[0]);
                    interpolatedValue[1] = ((1 - t) * this._startValue[1]) + (t * this._endValue[1]);
                    interpolatedValue[2] = ((1 - t) * this._startValue[2]) + (t * this._endValue[2]);
                    interpolatedValue[3] = ((1 - t) * this._startValue[3]) + (t * this._endValue[3]);
                } else if (this._type === "float") {
					interpolatedValue = ((1 - t) * this._startValue) + (t * this._endValue);
				}

                if (this._delegate.handleAnimationValueUpdate) {
                    this._delegate.handleAnimationValueUpdate(this, this._path, interpolatedValue);
                }
            }
        }
    },

    stopAnimation: {
        value: function() {
            clearInterval(this._intervalRequest);
            //console.log("stopAnimation");
        }
    },

    run: {
        value: function() {
            var date = new Date();
            var time = date.getTime() / 1000.0;
            var self = this;
            this._startTime = time;
            this._intervalRequest = setInterval( function() { self.handleUpdate.call(self) }, 1 / 30);
            setTimeout( function() { self.stopAnimation.call(self) }, this._duration * 1000);
        }
    }

});

Effect = exports.Effect = Montage.create(Montage, {

    //name set by effect-library
    _name: {
        enumerable: true,
        value: ""
    },

    /**
	Effect's name.

    @property
    */
    name: {
        enumerable: false,
        get: function() {
            return this._name;
        },
        set: function(value) {
            this._name = value;
        }
    },

    _profiles: {
        enumerable: true,
        value: {}
    },

    profiles: {
        enumerable: false,
        get: function() {
            return this._profiles;
        },
        set: function(value) {
            this._profiles = value;
        }
    },

    // TODO: keep this and remove effect loader
    _template: {
        enumerable: true,
        value: {}
    },

    template: {
        enumerable: false,
        get: function() {
            return this._template;
        },
        set: function(value) {
            this._template = value;
        }
    },

    loadTemplate: {
        value: function (callback, name, builtIn, context) {
			if (this.template && (!this._isTemplateLoaded || !this._isTemplateLoading)) {
                this._isTemplateLoading = true;
                var self = this;
                var info, filename;


                var oldInputs = this.inputs;

                var onTemplateLoad = function(template) {
                    template.instantiateWithOwnerAndDocument(self, window.document, function(ownerObject) {


                        ownerObject.name = name;

                        if (oldInputs) {
                            var keys = Object.keys(oldInputs);
                            keys.forEach( function(key) {
                                ownerObject.inputs[key].value = oldInputs[key].value;
                            }, this);
                        }

                        if (callback) {
                            callback(ownerObject,context);
                        }
                    });

                    self._isTemplateLoaded = true;
                    self._isTemplateLoading = false;
                };
				var requireInUse;
				if (builtIn) {
					info = Montage.getInfoForObject(this);
	                requireInUse = info.require;
				} else {
					requireInUse = window.require;
				}

                Template.templateWithModuleId(requireInUse, this.template, onTemplateLoad);
            }
        }
    },

	_inputsDidChange: {
		value: function() {
			var keys = this.inputKeys;

			var self = this;

			keys.forEach(function(key) {
				var savedValue = this.inputs[key].value;

				// first define private value field
				Montage.defineProperty(this.inputs[key], "_value", { writable:true , value: null });

				// then hook on the property change to allow implicit animations
				Montage.defineProperty(this.inputs[key], "handleAnimationValueUpdate", {
					value: function(animation, key, interpolatedValue) {
			            this.animatedValue = interpolatedValue;
			        }
				});

				// experimentation
				Montage.defineProperty(this.inputs[key], "animatedValue", { writable:true , value: null });

				// setter & getter
				Montage.defineProperty(this.inputs[key], "value", {
					get: function() { return this._value; },
					set: function(value) {

						var animates = AnimationManager.animationDuration > 0;

						if (animates && (this._value !== null) && (this.type === "vec4")) {
						    var animation = Montage.create(SimpleAnimation);

		                    animation.init(null, "vec4", this._value, value, AnimationManager.animationDuration, this, this);
		                    animation.run();
		                } else {
		                	this.animatedValue = value;
						}

						this._value = value;
					}
				});

				this.inputs[key].animatedValue = savedValue;
				this.inputs[key].value = savedValue;

			}, this);

		}
	},

    _inputs: {
        enumerable: false,
        value: null
    },

    /**
    Inputs

    @function
	@param {String} name of the repository
	@param {Object} templates templated as { templateName : templateLocation }
    @returns {Effect}
    */
    inputs: {
        enumerable: true,
        get: function() {
            return this._inputs;
        },
        set: function(value) {
            this._inputs = value;
            this._inputsDidChange();
        }
    },

    /**
	Returns all the effect input keys.
    This method is readonly.

    @function
    @returns an array containing effect input keys
    */
    inputKeys: {
        enumerable: false,
        get: function() {

            return this._inputs ? Object.keys(this._inputs) : [];
        }
    },
});
