/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage,
    Uuid = require("montage/core/uuid").Uuid;
//var Moose = require("moose").Moose;

var TestObject = (function() {
    var instances = [];
    // used to cleanup cached urn's.
    var level = 0;

    function cleanup() {
        for (var i = 0, instance; instance = instances[i]; i++) {
            instance._reference = false;
        }
    }

    function getObjectDesc(object) {
        for (var i = 0, instance; instance = instances[i]; i++) {
            if (object === instance.obj) {
                return instance;
            }
        }
    }

    function serValue(value) {
        if (typeof value !== "object") {
            return JSON.stringify(value);
        } else if (Array.isArray(value)) {
            return "[" + value.map(function(el) {
                return serValue(el);
            }).join(",") + "]";
        } else {
            return getObjectDesc(value).ser();
        }
    }

    return function(props, isClass) {
        var object = {};
        var isInstance = !isClass;

        instances.push(object);

        object.urn = function() {
            return 'm-obj://' + this.info.objectName + (isInstance ? '/' + (this.obj.UID||'FAIL') : '');
        }

        object.furn = function() {
            return 'm-obj://' + this.info.objectName + (isInstance ? '/' + (this.obj.UID||'FAIL') : '') + '?mId=' + this.info.moduleId;
        }

        object.ser = function() {
            var ser;
            var names = Montage.getSerializablePropertyNames(this.obj);
            var serProps = [];

            level++;

            if (this._reference) {
                ser = this.ref();
            } else {
                this._reference = true;
                for (var i = 0, name; name = names[i]; i++) {
                    serProps.push('"'+name+'": ' + serValue(this.obj[name]));
                }
                ser = 'U("' + this.furn() + '", {' + serProps.join(",") + '})';
            }

            level--;
            if (level === 0) cleanup();
            return ser;
        };
        object.ref = function() {
            return 'U("' + this.urn() + '")';
        };
        for (var key in props) if (props.hasOwnProperty(key)) {
            object[key] = props[key];
        }

        return object;
    }
})();

var TestObjectsDesc = exports.TestObjectsDesc = {};

var Empty = exports.Empty = Montage.create(Montage);
TestObjectsDesc.empty = TestObject({
    obj: Empty,
    info: {
        moduleId: "testobjects",
        objectName: "Empty"
    }
}, true);

var emptyA = Empty.create();
TestObjectsDesc.emptyA = TestObject({
    obj: emptyA,
    info: {
        moduleId: "testobjects",
        objectName: "Empty"
    }
});

var Simple = exports.Simple = Montage.create(Montage, {
    number: {value: 42, serializable: true},
    string: {value: "string", serializable: true},
    regexp: {value: /regexp/gi}
});
TestObjectsDesc.simple = TestObject({
    obj: Simple,
    info: {
        moduleId: "testobjects",
        objectName: "Simple"
    }
});

var simpleA = Simple.create();
TestObjectsDesc.simpleA = TestObject({
    obj: simpleA,
    info: {
        moduleId: "testobjects",
        objectName: "Simple"
    },
    ser: function() {
        return TestObjectsDesc.simple.ser(this.obj) ;
    }
});

var Klass = exports.Klass = function() {
    this.hello = function(name) {
        return "hello " + name;
    }
    this.foo = 226;
};
TestObjectsDesc.klass = TestObject({
    obj: Klass,
    info: {
        moduleId: "testobjects",
        objectName: "Klass"
    },
    ser: function(instance) {
        return 'U("m-obj://Klass' + (instance ? '/' + (instance.UID||'FAIL') : '') + '?mId=testobjects", {})';
    }
});

var Composed = exports.Composed = Montage.create(Montage, {
    tags: {value: ["object", "composed", "test"], serializable: true},
    simpleObj: {value: simpleA, serializable: true}
});
TestObjectsDesc.composed = TestObject({
    obj: Composed,
    info: {
        moduleId: "testobjects",
        objectName: "Composed"
    }
});

var composedA = Composed.create();
TestObjectsDesc.composedA = TestObject({
    obj: composedA,
    info: {
        moduleId: "testobjects",
        objectName: "Composed"
    },
    ser: function() {
        return 'U("' + this.furn(this.obj) + '", {"tags": ["object","composed","test"],"simpleObj": ' + TestObjectsDesc.simpleA.ser() + '})';
    }
});
TestObjectsDesc.composedA.obj.simpleObj = simpleA;

var selfCycleA = Montage.create(Montage);
Montage.defineProperty(selfCycleA, "self", {value: selfCycleA, serializable: true});
(selfCycleA.UID);
TestObjectsDesc.selfCycleA = TestObject({
    obj: selfCycleA,
    info: {
        moduleId: "montage",
        objectName: "Montage"
    },
    ser: function() {
        return 'U("' + this.furn(this.obj) + '", {"self": ' + this.ref(this.obj)+ '})';
    }
});

var indirectCycleA = Montage.create(Montage);
(indirectCycleA.UID);
TestObjectsDesc.indirectCycleA = TestObject({
    obj: indirectCycleA,
    info: {
        moduleId: "montage",
        objectName: "Montage"
    },
    ser: function() {
        return 'U("' + this.furn(this.obj) + '", {"B": ' + TestObjectsDesc.indirectCycleB.ser(indirectCycleB)+ '})';
    }
});

var indirectCycleB = Montage.create(Montage);
(indirectCycleB.UID);
TestObjectsDesc.indirectCycleB = TestObject({
    obj: indirectCycleB,
    info: {
        moduleId: "montage",
        objectName: "Montage"
    },
    ser: function() {
        return 'U("' + this.furn(this.obj) + '", {"A": ' + TestObjectsDesc.indirectCycleA.ref(indirectCycleA)+ '})';
    }
});

Montage.defineProperty(indirectCycleA, "B", {value: indirectCycleB, serializable: true});
Montage.defineProperty(indirectCycleB, "A", {value: indirectCycleA, serializable: true});

var Custom = exports.Custom = Montage.create(Montage, {
    manchete: {value: 42},

    serializeSelf: {value: function(serializer) {
        serializer.set("manchete", 226);
    }},

    deserializeSelf: {value: function(serializer) {
        this.manchete = serializer.get("manchete");
    }}
});

TestObjectsDesc.custom = TestObject({
    obj: Custom,
    info: {
        moduleId: "testobjects",
        objectName: "Custom"
    },
    ser: function(instance) {
        return 'U("m-obj://Custom' + (instance ? '/'+instance.UID : '') + '?mId=testobjects", {"manchete": 226})';
    }
});

var customA = Custom.create();
TestObjectsDesc.customA = TestObject({
    obj: customA,
    info: {
        moduleId: "testobjects",
        objectName: "Custom"
    },
    ser: function() {
        return TestObjectsDesc.custom.ser(this.obj);
    }
});
