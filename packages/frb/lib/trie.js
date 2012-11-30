
module.exports = makeTrie;
function makeTrie(table) {
    var strings = Object.keys(table);
    var trie = {value: void 0, children: {}};
    var tables = {};
    strings.forEach(function (string) {
        if (string.length === 0) {
            trie.value = table[string];
        } else {
            var character = string[0];
            if (!tables[character]) {
                tables[character] = {};
            }
            var tail = string.slice(1);
            tables[character][tail] = table[string];
        }
    });
    var characters = Object.keys(tables);
    characters.forEach(function (character) {
        trie.children[character] = makeTrie(tables[character]);
    });
    return trie;
}

