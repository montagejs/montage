/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

var Simple = exports.Simple = Montage.create(Montage, {
    simple: {value: null},
    prototypeUuid: {value: "a"}
}, module);

var Proto = exports.Proto = Montage.create(Montage, {
    proto: {value: null},
    prototypeUuid: {value: "b"}
}, module);

var FunkyProto = exports.FunkyProto = Montage.create(Montage, {
    firstUuid: {value: null},
});
Montage.getInfoForObject(FunkyProto);

var SubProto = exports.SubProto = Montage.create(Proto, {
    subProto: {value: null},
    prototypeUuid: {value: "c"}
}, module);

var Funktion = exports.Funktion = function() {
    this.foo = function() {
        return 42;
    };
}
