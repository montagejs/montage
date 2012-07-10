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
var Montage = require("montage").Montage,
    Serializer = require("core/serializer").Serializer,
    Deserializer = require("core/deserializer").Deserializer;

exports.Preferences = Montage.create(Montage, {

    automaticallyLoadPreferences: {
        value: true
    },

    localStorageKey: {
        value: null
    },

    defaultValues: {
        value: null
    },

    values: {
        value: null
    },

    didCreate: {
        value: function() {
            this.values = this.defaultValues.clone();

            if (this.automaticallyLoadPreferences) {
                this.load();
            }
        }
    },

    load: {
        value: function() {
            if (!localStorage) {
                return;
            }

            if (!this.localStorageKey) {
                throw "No localStorageKey set for loading preferences";
            }

            var preferencesSerialization = localStorage.getItem(this.localStorageKey),
                deserializer,
                self;

            if (preferencesSerialization) {
                deserializer = Deserializer.create();
                self = this;

                try {
                    deserializer.initWithStringAndRequire(preferencesSerialization, require).deserializeObject(function(savedValues) {
                        self.values = savedValues;
                    }, require);
                } catch(e) {
                    console.error("Could not load saved preferences from " + this.localStorageKey);
                    console.debug("Could not deserialize", preferencesSerialization);
                    console.log(e.stack);
                }
            }
        }
    },

    save: {
        value: function() {
            if (!localStorage) {
                return;
            }

            if (!this.localStorageKey) {
                throw "No localStorageKey set for saving preferences";
            }

            var serializer = Serializer.create().initWithRequire(require);
            localStorage.setItem(this.localStorageKey, serializer.serializeObject(this.values));
        }
    },

    reset: {
        value: function() {
            if (this.defaultValues) {
                this.values = this.defaultValues.clone();
            }
        }
    }

});
