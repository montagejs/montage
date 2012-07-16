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
        Mfiddle.serialization = CodeMirror(document.getElementById("serialization"), {
            mode: {
                name: "javascript",
                json: true
            },
            tabSize: 2,
            matchBrackets: true,
            lineNumbers: true
        });

        Mfiddle.html = CodeMirror(document.getElementById("html"), {
            mode:  "htmlmixed",
            tabSize: 2,
            lineNumbers: true
        });

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
        document.getElementById("run").addEventListener("click", Mfiddle.execute, false);
    },

    getParameter: function(name) {
        return this.queryString[name];
    },

    load: function(serialization, html) {
        serialization = serialization.replace(/\{\s*(\"[#@]\")\s*:\s*(\"[^\"]+\")\s*\}/g, "{$1: $2}")
            .replace(/\{\s*(\"(?:<-|<->)\")\s*:\s*(\"[^\"]+\"\s*(?:,\s*\"converter\"\s*:\s*\{\s*\"@\"\s*:\s*\"[^\"]+\"\s*\}\s*|,\s*\"deferred\"\s*:\s*(true|false)\s*)*)\}/g, function(_, g1, g2) {
                return "{" + g1 + ": " + g2.replace(/,\s*/, ", ").replace(/\n\s*/, "") + "}";
            });

        Mfiddle.serialization.setValue(serialization);
        Mfiddle.html.setValue(html);
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
    },


    createMontageApplication: function(doc) {
        doc.head.innerHTML = "";

        var montageScript = doc.head.appendChild(doc.createElement("script"));
        montageScript.src = "../../montage.js";
        montageScript.setAttribute("data-auto-package", "");

        var serializationScript = doc.head.appendChild(doc.createElement("script"));
        serializationScript.type = "text/montage-serialization";
        serializationScript.textContent = Mfiddle.serialization.getValue();

        doc.body.innerHTML = Mfiddle.html.getValue();
    }
}

var Components = {
    componentId: 0,

    setup: function() {
        Array.prototype.map.call(document.querySelectorAll("*[data-component]"), function(button) {
            var componentName = button.getAttribute("data-component");
            button.addEventListener("click", function() {
                var object = JSON.parse(Mfiddle.serialization.getValue()||"{}"),
                    htmlString = Mfiddle.html.getValue(),
                    name,
                    id;

                name = componentName.replace(/(?:^|-)([^-])/g, function(_, g1) { return g1.toUpperCase() });
                name = name[0].toLowerCase() + name.slice(1);
                do {id = name + ++Components.componentId} while (id in object);

                object[id] = JSON.parse(Components.data[componentName]);
                object[id].properties.element = {"#": id};

                htmlString += "\n" + (object[id].html || '<div data-montage-id=""></div>').replace('data-montage-id=""', 'data-montage-id="' + id + '"');
                delete object[id].html;

                Mfiddle.load(JSON.stringify(object, null, "  "), htmlString);
            }, false);
        });
    },

    data: {
        "dynamic-text": JSON.stringify({
            "prototype": "montage/ui/dynamic-text.reel",
            "properties": {
                "value": "Text"
            },
            "html": '<p data-montage-id=""></p>'
        }),
        "button": JSON.stringify({
            "prototype": "montage/ui/bluemoon/button.reel",
            "properties": {
                "value": "Button",
                "enabled": true
            },
            "html": '<div data-montage-id="" class="text"></div>'
        }),
        "textfield": JSON.stringify({
            "prototype": "montage/ui/bluemoon/textfield.reel",
            "properties": {
                "value": "Editable text"
            },
            "html": '<input data-montage-id="" type="text">'
        }),
        "checkbox": JSON.stringify({
            "prototype": "montage/ui/bluemoon/checkbox.reel",
            "properties": {
                "checked": true
            }
        }),
        "toggle": JSON.stringify({
            "prototype": "montage/ui/bluemoon/toggle.reel",
            "properties": {
                "value": true
            }
        }),
        "slider": JSON.stringify({
            "prototype": "montage/ui/bluemoon/slider.reel",
            "properties": {
                "minValue": 0,
                "maxValue": 100,
                "value": 50
            }
        }),
        "repetition": JSON.stringify({
            "prototype": "montage/ui/repetition.reel",
            "properties": {
                "objects": [1, 2, 3]
            },
            "html": '<ul data-montage-id=""><li>Item</li></ul>'
        })
    }
};

var Examples = {
    setup: function() {
        Array.prototype.map.call(document.querySelectorAll("#examples li"), function(button) {
            var name = button.textContent;
            button.addEventListener("click", function() {
                Examples.loadExample(name);
            });
        });
    },

    loadExample: function(name) {
        var example = Examples.data[name];

        Mfiddle.load(JSON.stringify(example.serialization, null, "  "), example.html);
        Mfiddle.execute();
    },

    data: {
        "A simple Button": {
            serialization: {
                "button": {
                    "prototype": "montage/ui/bluemoon/button.reel",
                    "properties": {
                        "element": {"#": "button"},
                        "value": "Click Me!"
                    }
                }
            },
            html: '<div data-montage-id="button" class="text"></div>'
        },

        "A simple Binding": {
            serialization: {
                "slider": {
                    "prototype": "montage/ui/bluemoon/slider.reel",
                    "properties": {
                        "element": {"#": "slider"},
                        "value": 50
                    }
                },

                "dynamicText": {
                    "prototype": "montage/ui/dynamic-text.reel",
                    "properties": {
                        "element": {"#": "dynamicText"}
                    },
                    "bindings": {
                        "value": {"<-": "@slider.value"}
                    }
                }
            },
            html: '<div data-montage-id="slider"></div>\n<h2 data-montage-id="dynamicText"></h2>'
        },

        "Two way Bindings": {
            serialization: {
                "number": {
                    "prototype": "montage/ui/input-number.reel",
                    "properties": {
                        "element": {"#": "number"},
                        "value": 50
                    }
                },

                "slider1": {
                    "prototype": "montage/ui/bluemoon/slider.reel",
                    "properties": {
                        "element": {"#": "slider1"}
                    },
                    "bindings": {
                        "value": {"<->": "@number.value"}
                    }
                },

                "slider2": {
                    "prototype": "montage/ui/bluemoon/slider.reel",
                    "properties": {
                        "element": {"#": "slider2"}
                    },
                    "bindings": {
                        "value": {"<->": "@number.value"}
                    }
                }
            },
            html: '<input type="number" data-montage-id="number">\n<div data-montage-id="slider1" style="width: 20%"></div>\n<div data-montage-id="slider2"></div>'
        },

        "Accessing Repetition objects": {
            serialization: {
                "repetition": {
                    "prototype": "montage/ui/repetition.reel",
                    "properties": {
                        "objects": ["Mike", "François", "Afonso", "Heather"],
                        "element": {"#": "repetition"}
                    }
                },
                "dynamicText": {
                    "prototype": "montage/ui/dynamic-text.reel",
                    "properties": {
                        "element": {"#": "dynamicText"}
                    },
                    "bindings": {
                        "value": {"<-": "@repetition.objectAtCurrentIteration"}
                    }
                }
            },
            html: '<ul data-montage-id="repetition">\n  <li>\n    Hello there <span data-montage-id="dynamicText"></span>!\n  </li>\n</ul>'
        }
    }
};

document.addEventListener("DOMContentLoaded", Mfiddle.init, false);

})();
