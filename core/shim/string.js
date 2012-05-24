
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function (start) {
            return this.length >= start.length &&
                this.slice(0, start.length) === start;
        }
    });
}

if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        value: function (end) {
            return this.length >= end.length &&
                this.slice(this.length - end.length, this.length) === end;
        }
    });
}

