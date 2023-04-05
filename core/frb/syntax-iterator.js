/*
    Cues from

    https://blog.mgechev.com/2014/09/12/binary-tree-iterator-with-es6-generators/

    https://github.com/mgechev/javascript-algorithms/blob/master/src/data-structures/binary-search-tree.js#L65-L72

*/


function SyntaxIterator(syntax, type){
    if(syntax) {
        this._syntax = syntax;
        this._parentBySyntax = new WeakMap();
        this._parentBySyntax.set(syntax,null);
        /*
            Initially, during the creation of the iterator, we need to call it because the next method is actually a generator, so by invoking it we return new instance of the generator.
        */
        var _iterator = this.next(type,this._syntax);
        _iterator.parent = (syntax) => {
            return this._parentBySyntax.get(syntax);
        };
        return _iterator;
    }
};

function SyntaxInOrderIterator(syntax, type) {
    return SyntaxIterator.call(this,syntax, type);
}
SyntaxInOrderIterator.prototype = new SyntaxIterator();
SyntaxInOrderIterator.prototype.constructor = SyntaxInOrderIterator;

SyntaxInOrderIterator.prototype.next = function* (type, current) {
    var localType;

    if (current === undefined) {
        current = this._syntax;
    }

    if (current === null) {
        return;
    }

    if(current.args && current.args[0]) {
        this._parentBySyntax.set(current.args[0],current);
        localType = yield* this.next(type, current.args[0]);
    }

    localType = localType === undefined
            ? type
            : localType;

    if(!localType || current.type === localType) {
        localType = yield current;

        localType = localType === undefined
        ? type
        : localType;

    }

    if(current.args && current.args[1]) {
        this._parentBySyntax.set(current.args[1],current);
        localType = yield* this.next(type, current.args[1]);
    }

    localType = localType === undefined
    ? type
    : localType;

};

function SyntaxPostOrderIterator(syntax, type) {
    return SyntaxIterator.call(this,syntax, type);
}
SyntaxPostOrderIterator.prototype = new SyntaxIterator();
SyntaxPostOrderIterator.prototype.constructor = SyntaxPostOrderIterator;

SyntaxPostOrderIterator.prototype.next = function* (type, current) {
    var localType;

    if (current === undefined) {
        current = this._syntax;
    }

    if (current === null) {
        return;
    }

    if(current.args && current.args[0]) {
        this._parentBySyntax.set(current.args[0],current);
        localType = yield* this.next(type, current.args[0]);
    }

    localType = localType === undefined
            ? type
            : localType;


    if(current.args && current.args[1]) {
        this._parentBySyntax.set(current.args[1],current);
        localType = yield* this.next(type, current.args[1]);
    }

    localType = localType === undefined
    ? type
    : localType;


    if(!localType || current.type === localType) {
        localType = yield current;

        localType = localType === undefined
        ? type
        : localType;

    }

};


function SyntaxPreOrderIterator(syntax, type) {
    return SyntaxIterator.call(this,syntax, type);
}
SyntaxPreOrderIterator.prototype = new SyntaxIterator();
SyntaxPreOrderIterator.prototype.constructor = SyntaxPreOrderIterator;

SyntaxPreOrderIterator.prototype.next = function* (type, current) {
    var localType;

    if (current === undefined) {
        current = this._syntax;
    }

    if (current === null) {
        return;
    }

    if(!localType || current.type === localType) {
        localType = yield current;

        localType = localType === undefined
        ? type
        : localType;

    }

    if(current.args && current.args[0]) {
        this._parentBySyntax.set(current.args[0],current);
        localType = yield* this.next(type, current.args[0]);
    }

    localType = localType === undefined
            ? type
            : localType;


    if(current.args && current.args[1]) {
        this._parentBySyntax.set(current.args[1],current);
        localType = yield* this.next(type, current.args[1]);
    }

    localType = localType === undefined
    ? type
    : localType;


};



exports.SyntaxIterator = SyntaxIterator;
exports.SyntaxInOrderIterator = SyntaxInOrderIterator;
exports.SyntaxPostOrderIterator = SyntaxPostOrderIterator;
exports.SyntaxPreOrderIterator = SyntaxPreOrderIterator;

