/*
     Range using:
        - https://github.com/moll/js-strange
        - https://www.npmjs.com/package/strange

        a range object for JavaScript. Use it to have a single value type with two endpoints and their boundaries.
        Also implements an interval tree for quick lookups. Stringifies itself in the style of [begin,end) and allows you to parse a string back.
        Also useful with PostgreSQL.
*/

var Range = require("strange");

exports.Range = Range;
