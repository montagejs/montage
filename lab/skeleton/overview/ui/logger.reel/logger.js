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

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Logger = Montage.create(Component, {
  _messages: {
    enumerable: false,
    value: ["Logger (click to open)"]
  },
  _open: {
    enumerable: false,
    value: false
  },
  _new_log: {
    enumerable: false,
    value: false
  },

  prepareForActivationEvents: {
    enumerable: false,
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

      this._messages.push("["+h+":"+m+":"+s+"] " + msg);
      // Only save the last 10 messages
      if (this._messages.length > 10) {
        this._messages = this._messages.slice(-10);
      }
      this._new_log = true;
      this.needsDraw = true;
    }
  },

  // People can set this logger as their action handler to get an automatic
  // log.
  handleAction: {
    value: function(ev) {
      // TODO: change this to print out the component name (if possible) or
      // just more information
      var msg = "Action event on " + ev.target.element.tagName.toLowerCase();
      var id = ev.target.element.dataset.montageId || ev.target.id;
      if (id) {
        msg += "#"+id;
      }
      this.log(msg);
    }
  },

  draw: {
    value: function() {
      if (this._open) {
        this.output.value = this._messages.join("\n");
      } else {
        this.output.value = this._messages[this._messages.length-1];
      }

      if (this._new_log) {
        this.element.classList.add("logger-hilight");
        this._new_log = false;

        var self = this;
        window.setTimeout(function() {
          self.needsDraw = true;
        }, 300);
      } else {
        this.element.classList.remove("logger-hilight");
      }
    }
  },

  handleClick: {
    value: function(ev) {
      this._open = !this._open;
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
