
module.exports = makeLeftToRightParser;
function makeLeftToRightParser(parsePrevious, parseOperator, makeSyntax) {
    var parseSelf = function (callback, left) {
        if (left) {
            return parseOperator(function (operator) {
                if (operator) {
                    return parsePrevious(function (right) {
                        return parseSelf(callback, makeSyntax(operator, left, right));
                    });
                } else {
                    return callback(left);
                }
            });
        } else {
            return parsePrevious(function (left) {
                return parseSelf(callback, left);
            });
        }
    };
    return parseSelf;
}

