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

  prepareForDraw: {
    enumerable: false,
    value: function() {
      this.element.addEventListener('click', this);
    }
  },

  log: {
    value: function(msg) {
      var d = new Date();
      this._messages.push("["+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"] " + msg);
      // Only save the last 10 messages
      if (this._messages.length > 10) {
        this._messages = this._messages.slice(-10);
      }
      this.needsDraw = true;
    }
  },

  draw: {
    value: function() {
      if (this._open) {
        this.output.value = this._messages.join("\n");
      } else {
        this.output.value = this._messages[this._messages.length-1];
      }
    }
  },

  handleClick: {
    value: function(ev) {
      this._open = !this._open;
      this.log("open/close");
      this.needsDraw = true;
    }
  }
});