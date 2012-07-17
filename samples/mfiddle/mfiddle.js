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
var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.Mfiddle = Montage.create(Component, {
    hasTemplate: {value: false},
    templateObjects: {value: {}},
    _componentId: {value: 1},

    templateDidLoad: {
        value: function() {
            var example = this.examples[0];

            this.addEventListener("action", this, false);
            this.loadExample(example);
            this.executeFiddle();
        }
    },

    components: {
        value: require("components").components
    },
    examples: {
        value: require("examples").examples
    },

    loadFiddle: {
        value: function(css, serialization, html, javascript) {
            if (css != null) {
                this.templateObjects.cssCodeMirror.value = css;
            }
            if (serialization != null) {
                this.templateObjects.serializationCodeMirror.value = serialization;
            }
            if (html != null) {
                this.templateObjects.htmlCodeMirror.value = html;
            }
            if (javascript != null) {
                this.templateObjects.javascriptCodeMirror.value = javascript;
            }
        }
    },

    executeFiddle: {
        value: function() {
            var templateObjects = this.templateObjects;

            templateObjects.montageFrame.load(
                templateObjects.cssCodeMirror.value,
                templateObjects.serializationCodeMirror.value,
                templateObjects.htmlCodeMirror.value,
                templateObjects.javascriptCodeMirror.value
            );
        }
    },

    loadExample: {
        value: function(example) {
            this.loadFiddle(example.css, this._stringifySerialization(example.serialization), example.html, example.javascript);
            this.executeFiddle();
        }
    },

    addComponentToFiddle: {
        value: function(component) {
            // TODO: need to add a serialization checker
            var serializationObject = JSON.parse(this.templateObjects.serializationCodeMirror.value),
                html = this.templateObjects.htmlCodeMirror.value,
                name = component.name,
                id;

            do {
                id = name + this._componentId++;
            } while (id in serializationObject);

            serializationObject[id] = component.serialization;
            serializationObject[id].properties.element = {"#": id};

            html += "\n" + component.html.replace('data-montage-id=""', 'data-montage-id="' + id + '"');

            this.loadFiddle(null, this._stringifySerialization(serializationObject), html, null);
            this.executeFiddle();
        }
    },

    handleComponentButtonAction: {
        value: function(action) {
            this.addComponentToFiddle(action.target.component);
        }
    },

    handleRunAction: {
        value: function() {
            this.executeFiddle();
        }
    },

    handleExampleButtonAction: {
        value: function(action) {
            this.loadExample(action.target.example);
        }
    },

    _stringifySerialization: {
        value: function(object) {
            return JSON.stringify(object, null, 2)
                .replace(/\{\s*(\"[#@]\")\s*:\s*(\"[^\"]+\")\s*\}/g, "{$1: $2}")
                .replace(/\{\s*(\"(?:<-|<->)\")\s*:\s*(\"[^\"]+\"\s*(?:,\s*\"converter\"\s*:\s*\{\s*\"@\"\s*:\s*\"[^\"]+\"\s*\}\s*|,\s*\"deferred\"\s*:\s*(true|false)\s*)*)\}/g, function(_, g1, g2) {
                    return "{" + g1 + ": " + g2.replace(/,\s*/, ", ").replace(/\n\s*/, "") + "}";
                });
        }
    }

});

(function() {

var Mfiddle = {
    init: function() {
        Mfiddle.setup();
        Examples.setup();
        Components.setup();

        var serialization = Mfiddle.getParameter("serialization") || "",
            html = Mfiddle.getParameter("html") || "",
            example = Mfiddle.getParameter("example") || "A simple Button";

        if (serialization || html) {
            Mfiddle.load(serialization, html);
            Mfiddle.execute();
        } else {
            Examples.loadExample(example);
        }
    },

    setup: function() {
        Mfiddle.queryString = {};
        window.location.hash.slice(1).split("&").forEach(function(item) {
            var param = item.split("="),
                key = decodeURIComponent(param[0]),
                value = decodeURIComponent(param[1]);

            Mfiddle.queryString[key] = value;
        });

        document.addEventListener("keydown", function(event) {
            if ((event.metaKey || event.ctrlKey) && event.keyCode == 83) {
                event.preventDefault();
                    Mfiddle.execute();
            }
        }, false);
    },

    getParameter: function(name) {
        return this.queryString[name];
    },

    executeIframe: document.createElement("iframe"),
    execute: function() {
        var iframe = Mfiddle.executeIframe;

        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }

        document.getElementById("result").appendChild(iframe);
        Mfiddle.createMontageApplication(iframe.contentDocument);

        // hijacks iframe's console.debug
        iframe.contentWindow.console.debug = function() {
            if (arguments[0].indexOf("Syntax error") == 0) {
                iframe.contentDocument.body.innerHTML = "<pre>" + arguments[0] + "</pre>";
            } else {
                console.debug.apply(console, arguments);
            }
        }
    }
}

});