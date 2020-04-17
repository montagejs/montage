
module.exports = Scope;
function Scope(value) {
    this.parent = null;
    this.value = value;
}

Scope.prototype.nest = function (value) {
    var child = Object.create(this);
    child.value = value;
    child.parent = this;
    return child;
};

