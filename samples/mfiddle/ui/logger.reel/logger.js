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

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Logger = Montage.create(Component, {
    input: {
        distinct: true,
        value: []
    },
    isOpen: {
        value: false
    },

    _newMessages: {
        distinct: true,
        value: ["Logger (click to open)"]
    },
    _needsOpen: {
        value: false
    },
    _needsClose: {
        value: false
    },

    templateDidLoad: {
        value: function() {
            this.addPropertyChangeListener("input", this);
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this.element.addEventListener('click', this);
            this.element.addEventListener('touchend', this);
        }
    },

    log: {
        value: function(msg) {
            var d = new Date(),
                h = d.getHours(),
                m = d.getMinutes(),
                s = d.getSeconds();

            // zero padding
            if (m < 10) { m = "0" + m; }
            if (s < 10) { s = "0" + s; }

            this._newMessages.push("["+h+":"+m+":"+s+"] " + msg);
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            var newMessages = this._newMessages;

            if (this._needsOpen) {
                this._element.classList.add("open");
                this._needsOpen = false;
                this.isOpen = true;
            } else if (this._needsClose) {
                this._element.classList.remove("open");
                this._needsClose = false;
                this.isOpen = false;
            }

            if (newMessages.length > 0) {
                this.templateObjects.output.value += newMessages.join("\n") + "\n";
                newMessages.length = 0;
                this._element.classList.add("logger-hilight");

                var self = this;
                window.setTimeout(function() {
                  self.needsDraw = true;
                }, 100);
            } else {
              this._element.classList.remove("logger-hilight");
            }
        }
    },

    handleChange: {
        value: function(notification) {
            var newMessages = notification.plus;

            for (var i = 0, message; (message = newMessages[i]); i++) {
                this.log(message);
            }
        }
    },

    handleClick: {
        value: function(ev) {
            if (this.isOpen) {
                this._needsClose = true;
            } else {
                this._needsOpen = true;
            }
            this.needsDraw = true;
        }
    },
    handleTouchend: {
        value: function(ev) {
            this._open = !this._open;
            this.needsDraw = true;
        }
    }
});
