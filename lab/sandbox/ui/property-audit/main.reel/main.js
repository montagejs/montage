/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.

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
var Component = require("montage/ui/component").Component;
var Promise = require("montage/core/promise").Promise;
var Deserializer = require("montage/core/deserializer").Deserializer;
var ArrayController = require("montage/ui/controller/array-controller").ArrayController;

exports.Main = Montage.create(Component, {

    modules: {
        value: [
            "montage/ui/anchor.reel",
            "montage/ui/autocomplete/autocomplete.reel",
            "montage/ui/button.reel",
            "montage/ui/condition.reel",
            "montage/ui/dynamic-element.reel",
            "montage/ui/dynamic-text.reel",
            "montage/ui/flow.reel",
            "montage/ui/image.reel",
            "montage/ui/input-checkbox.reel",
            "montage/ui/input-date.reel",
            "montage/ui/input-number.reel",
            "montage/ui/input-radio.reel",
            "montage/ui/input-range.reel",
            "montage/ui/input-text.reel",
            "montage/ui/list.reel",
            "montage/ui/loader.reel",
            "montage/ui/loading-panel.reel",
            "montage/ui/loading.reel",
            "montage/ui/popup/alert.reel",
            "montage/ui/popup/confirm.reel",
            "montage/ui/popup/notifier.reel",
            "montage/ui/popup/popup.reel",
            "montage/ui/progress.reel",
            "montage/ui/repetition.reel",
            "montage/ui/rich-text-editor/rich-text-editor.reel",
            "montage/ui/rich-text-editor/overlays/rich-text-linkpopup.reel[RichTextLinkPopup]",
            "montage/ui/rich-text-editor/overlays/rich-text-resizer.reel",
            "montage/ui/scroll-bars.reel",
            "montage/ui/scroller.reel",
            "montage/ui/slot.reel",
            "montage/ui/substitution.reel",
            "montage/ui/text-slider.reel",
            "montage/ui/textarea.reel",
            "montage/ui/toggle-button.reel",
            "montage/ui/toggle-switch.reel",
            "montage/ui/token-field/token-field.reel",
            "montage/ui/token-field/token.reel",
            "montage/ui/native/anchor.reel",
            "montage/ui/native/button.reel",
            "montage/ui/native/image.reel",
            "montage/ui/native/input-checkbox.reel",
            "montage/ui/native/input-date.reel",
            "montage/ui/native/input-number.reel",
            "montage/ui/native/input-radio.reel",
            "montage/ui/native/input-range.reel",
            "montage/ui/native/input-text.reel",
            "montage/ui/native/progress.reel",
            "montage/ui/native/select.reel",
            "montage/ui/native/textarea.reel"
        ]
    },
//    modules: {
//        value: [
//            "montage/ui/anchor.reel",
//            "montage/ui/autocomplete/autocomplete.reel",
//            "montage/ui/condition.reel",
//            "montage/ui/dynamic-element.reel",
//            "montage/ui/dynamic-text.reel",
//            "montage/ui/flow.reel",
//            "montage/ui/list.reel",
//            "montage/ui/loader.reel",
//            "montage/ui/popup/alert.reel",
//             "montage/ui/popup/popup.reel",
//            "montage/ui/slot.reel",
//            "montage/ui/substitution.reel"
//        ]
//    },

    didCreate: {
        value: function() {
            this.instancesController = ArrayController.create();

            var main = this;
            var promises = [];
            var names = {};
            main.modules.forEach(function(module) {
                var desc = Deserializer.parseForModuleAndName(module);
                names[module] = desc.name;
                promises.push(require.async(desc.module));
            });
            Promise.all(promises)
            .then(function(exportsArray) {
                    var tempArray = [];
                    main.instancesController.content = tempArray;
                    for (var i = 0; i < exportsArray.length; i++) {
                        var exports = exportsArray[i];
                        console.log("Auditing: " + main.modules[i], names[main.modules[i]], exports[names[main.modules[i]]]);
                        tempArray.push(Instance.newWithObject(exports[names[main.modules[i]]].create()));
                    }

            });
       }
    },

    instances: {
        value: []
    },

    instancesController: {
        value: null
    }

});

var Instance = Montage.create(Montage, {

    newWithObject: {
        value: function(instance) {
            var newObject = this.create();
            newObject.instance = instance;
            newObject.name = instance._montage_metadata.property;
            newObject.module = instance._montage_metadata.module;


            newObject._serializableProperties = [];

            Montage.getSerializablePropertyNames(newObject.instance).forEach(function(propertyName) {
                newObject._serializableProperties.push(propertyName);
            });

            newObject._enumerableProperties = [];
            for (var propertyName in newObject.instance) {
                newObject._enumerableProperties.push(propertyName);
            }
            var propertyNames = [];
            do {
                propertyNames = propertyNames.concat(Object.getOwnPropertyNames(instance));
            } while (instance = Object.getPrototypeOf(instance));

            newObject.allPropertyNames = [];
            var existingProperties = Object.create(null);
            for (var i = 0; i < propertyNames.length; i++) {
                var propertyName = propertyNames[i];
                if(propertyName === "__elementAttributeDescriptors") {
                    debugger
                }
                if(! existingProperties[propertyName]) {
                    var desc = Object.getPropertyDescriptor(newObject.instance, propertyName);
                    existingProperties[propertyName] = true;
                    var prop = {
                        propertyName : propertyName,
                        descriptor : desc,
                        serializable : newObject._serializableProperties.indexOf(propertyName) !== -1,
                        enumerable : newObject._enumerableProperties.indexOf(propertyName) !== -1
                    };
                    if (prop.serializable || prop.enumerable) {
                        newObject.allPropertyNames.push(prop);
                    }

                }
           }
            return newObject;
        }
    },

    _enumerableProperties: {
        value: null
    },

    enumerableProperties: {
        get: function () {
            if (this._enumerableProperties === null) {
            }
            return this._enumerableProperties;
        }
    },

    _serializableProperties: {
        value: null
    },

    serializableProperties: {
        get: function () {
            if (this._serializableProperties === null) {
            }
            return this._serializableProperties;
        }
    },

    allPropertyNames: {
        value: null
    },

    instance: {
        value: null
    },

    label: {
        value: null
    }

});
