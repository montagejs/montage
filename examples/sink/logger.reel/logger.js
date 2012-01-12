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
      if (ev.target.id) {
        msg += "#"+ev.target.id;
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
    }
  },

  handleClick: {
    value: function(ev) {
      this._open = !this._open;
      this.needsDraw = true;
    }
  }
});