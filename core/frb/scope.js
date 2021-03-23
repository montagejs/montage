
module.exports = Scope;
function Scope(value) {
    this.value = value;
    return this;
}
Scope.prototype.parent = null;
Scope.prototype.nest = function (value) {
    var child = Object.create(this);
    child.value = value;
    child.parent = this;
    return child;
};

