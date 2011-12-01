/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var S = require("../lib/structures");
var Map = S.Map;
var Set = S.Set;
var OrderedSet = S.OrderedSet;
var CacheMap = S.CacheMap;

function SetTests(Set, extra) {
    return {
        "test empty": function (assert) {
            assert.ok(Set().empty(), "empty set is empty");
        },
        "test emptied": function (assert) {
            var set = Set();
            set.add(1);
            set.delete(1);
            assert.ok(set.empty(), "emptied set is empty");
        },
        "test has add delete object": function (assert) {
            var set = Set();
            var object = {};
            set.add(object);
            assert.ok(set.has(object), "set has added object");
            assert.ok(!set.has({}), "set does not have non-inseted object");
            set.delete(object);
            assert.ok(!set.has(object), "set does not have deleted object");
        },
        "test has add delete numbers": function (assert) {
            var set = Set();
            set.add(1);
            assert.ok(set.has(1), "set has added number");
            assert.ok(!set.has(2), "set does not have non-inseted number");
            set.delete(1);
            assert.ok(!set.has(1), "set does not have deleted number");
        },
        "test has add delete same bucket": function (assert) {
            var set = Set();
            var a = {};
            var b = {};
            set.add(a);
            set.add(b);
            assert.ok(set.has(a), "set has object");
            assert.ok(set.has(b), "set has other object in same bucket");
            set.delete(b);
            assert.ok(set.has(a), "set still has object after other is deleted");
            assert.ok(!set.has(b), "set doesn't have other object after removal");
            set.delete(a);
            assert.ok(!set.has(a), "set no longer has first object after removal");
        },
        "test reeaddition": function (assert) {
            var set = Set();
            var object = {};
            set.add(object);
            assert.ok(!set.empty(), "addion worked as evidenced by non-empty");
            assert.ok(set.has(object), "addion worked as evidenced by containing added object");
            set.add(object);
            set.add(object);
            set.delete(object);
            assert.ok(set.empty(), "readdition idempotent");
        },
        "test forEach": function (assert) {
            values = [false, null, undefined, 0, 1, {}];
            values.forEach(function (a) {
                var set = Set();
                set.add(a);
                set.forEach(function (b) {
                    assert.strictEqual(a, b, "value " + a);
                });
            });
        },
        "test extra": extra
    }
}

function MapTests(Map, extra) {
    return {
        "test empty": function (assert) {
            assert.ok(Map().empty(), "empty map is empty");
        },
        "test get set del has object": function (assert) {
            var map = Map();
            assert.equal(map.get(1), undefined, "non-existant key is undefined");
            var key = {};
            var value = {};
            map.set(key, value);
            assert.strictEqual(map.get(key), value, "object key maps to set object value");
            map.delete(key);
            assert.ok(!map.has(key), "map lacks key after removal");
        },
        "test get set del has object under duress": function (assert) {
            var map = Map();
            assert.equal(map.get(1), undefined, "non-existant key is undefined");
            var key = {};
            var value = {};
            map.set({}, {});
            map.set(key, value);
            map.set({}, {});
            assert.strictEqual(map.get(key), value, "object key maps to set object value");
            map.delete(key);
            assert.ok(!map.has(key), "map lacks key after removal");
        },
        "test forEach set delete": function (assert) {
            var a = {key: {}, value: {}, name: "a"};
            var b = {key: {}, value: {}, name: "b"};
            var c = {key: {}, value: {}, name: "c"};
            var pairs = [a, b, c];
            var map = Map();
            map.set(a.key, a.value);
            map.set(b.key, b.value);
            map.set(c.key, c.value);
            var i = 0;
            map.forEach(function (value, key) {
                pairs.forEach(function (pair) {
                    assert.ok(
                        key === pair.key?
                            pair.value === value :
                            true,
                        pair.name
                    );
                });
                i++;
            });
            assert.equal(i, 3, "exhausted");
            pairs.forEach(function (pair) {
                map.delete(pair.key);
                assert.ok(!map.has(pair.key), pair.name + " deleted");
            });
            assert.ok(map.empty(), "empty after deletion")
        },
        "test extra": extra
    }
}

module.exports = {
    "test Set": SetTests(Set),
    "test OrderedSet": SetTests(OrderedSet, {
        "test forEach ordered": function (assert) {
            var set = OrderedSet();
            var values = [false, null, undefined, 0, 1, {}];
            values.forEach(set.add, set);
            set.forEach(function (value, i) {
                assert.strictEqual(value, values.shift(), "value " + value);
            });
        },
        "test forEach add delete": function (assert) {
            var set = OrderedSet();
            var values = [1, 2, 3, 4, 5];
            values.forEach(set.add, set);
            set.delete(3);
            set.add(3);
            values = [1, 2, 4, 5, 3];
            set.forEach(function (value, i) {
                assert.strictEqual(value, values.shift(), "value " + value);
            });
        }
    }),
    "test Map": MapTests(Map),
    "test CacheMap": MapTests(CacheMap, {
        "test maxLength linear": function (assert) {
            var map = CacheMap(null, {
                maxLength: 1
            });
            map.set(1, 'a');
            map.set(2, 'b');
            map.set(3, 'c');
            assert.deepEqual(map.keys(), [3], 'only the most recent remains')
            map.delete(3);
            assert.deepEqual(map.get(3), undefined, 'delete removes last value')
        },
        "test maxLength touch": function (assert) {
            var map = CacheMap(null, {
                maxLength: 2
            });
            map.set(1, 'a'); // 1:a
            assert.deepEqual(map.keys(), [1], 'set 1');
            map.set(2, 'b'); // 1:a 2:b
            assert.deepEqual(map.keys(), [1, 2], 'set 2');
            map.set(3, 'c'); // 2:b 3:c
            assert.deepEqual(map.keys(), [2, 3], 'set 3, dropped 1');
            map.get(2); // 3:c 2:b
            assert.deepEqual(map.keys(), [3, 2], 'touched 2');
            map.set(4, 'd'); // 2:b 4:d
            assert.deepEqual(map.keys(), [2, 4], 'set 4, dropped 3');
        },
        "test ondrop": function (assert) {
            var dropped;
            var map = CacheMap(null, {
                maxLength: 1,
                ondrop: function (node) {
                    dropped = node.key;
                }
            });
            map.set(1, "a");
            assert.equal(dropped, undefined, 'nothing dropped');
            map.set(2, "b");
            assert.equal(dropped, 1, '1 dropped');
        }
    })
};

if (require.main === module) {
    var TEST = require("test");
    var times = process.argv[2] || 1;
    for (var i = 0; i < times; i++) {
        TEST.run(module.exports);
    }
}

