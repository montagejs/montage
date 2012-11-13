
module.exports = makeParserFromTrie;
function makeParserFromTrie(trie) {
    var children = {};
    Object.keys(trie.children).forEach(function (character) {
        children[character] = makeParserFromTrie(trie.children[character]);
    });
    return function (callback, rewind) {
        rewind = rewind || identity;
        return function (character, loc) {
            if (children[character]) {
                return children[character](callback, function (callback) {
                    return rewind(callback)(character, loc);
                });
            } else {
                return callback(trie.value, rewind)(character, loc);
            }
        };
    };
}

function identity(x) {return x;}

