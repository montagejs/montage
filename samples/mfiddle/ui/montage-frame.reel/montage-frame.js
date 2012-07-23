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
/**
    @module "montage/ui/montage-frame.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/montage-frame.reel".MontageFrame
    @extends module:ui/component.Component
*/
exports.MontageFrame = Montage.create(Component, /** @lends module:"montage/ui/montage-frame.reel".MontageFrame# */ {
    _css: {value: null},
    _serialization: {value: null},
    _html: {value: null},
    _javascript: {value: null},
    _iframeReady: {value: false},
    _iframeWindow: {value: null},
    _iframeDocument: {value: null},
    _cssElement: {value: null},
    _serializationElement: {value: null},
    _javascriptElement: {value: null},

    logMessages: {
        distinct: true,
        value: []
    },

    prepareForDraw: {
        value: function() {
            var self = this;

            window.addEventListener("message", function(event) {
                if (event._event.source === self._element.contentWindow
                    && event.data === "ready") {
                    self._iframeReady = true;
                    self.needsDraw = true;
                    self._iframeWindow = self._element.contentWindow;
                    self._iframeDocument = self._element.contentDocument;
                    self._cssElement = self._iframeDocument.head.querySelector("style");
                    self._javascriptElement = self._iframeDocument.head.querySelector("script[type='text/montage-javascript']");

                    self._iframeWindow.console.debug = self.debug.bind(self);
                    self._iframeWindow.console.log = self.log.bind(self);
                }
            }, false);
        }
    },

    debug: {
        value: function(message) {
            if (message.indexOf("Syntax error") == 0) {
                this._iframeDocument.body.innerHTML = "<pre>" + message + "</pre>";
            } else {
                console.debug.apply(console, arguments);
            }
        }
    },

    log: {
        value: function(message) {
            this.logMessages.push(Array.prototype.join.call(arguments, " "));
            console.log.apply(console, arguments);
        }
    },

    load: {
        value: function(css, serialization, html, javascript) {
            this._css = css;
            this._serialization = serialization;
            this._html = html;
            this._javascript = javascript;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            if (this._iframeReady) {
                var oldSerialization = this._iframeDocument.head.querySelector("script[type='text/montage-serialization']");
                if (oldSerialization) {
                    oldSerialization.parentNode.removeChild(oldSerialization);
                }

                this._serializationElement = this._iframeDocument.createElement("script");
                this._serializationElement.setAttribute("type", "text/montage-serialization");
                this._iframeDocument.head.appendChild(this._serializationElement);

                this._iframeWindow.Frame.reset();
                this._cssElement.textContent = this._css;
                this._serializationElement.textContent = this._serialization;
                this._javascriptElement.textContent = this._javascript;
                this._iframeDocument.body.innerHTML = this._html;
                this._iframeWindow.Frame.boot();
            }
        }
    }
});
