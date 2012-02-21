/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var findObjectNameRegExp = /([^\/]+?)(\.reel)?$/,
    toCamelCaseRegExp = /(?:^|-)([^-])/g,
    replaceToCamelCase = function(_, g1) { return g1.toUpperCase() };

exports.convertModuleToPrototype = function(string) {
    var serialization = JSON.parse(string);

    for (var label in serialization) {
        var desc = serialization[label];

        if ("module" in desc) {
            var newDesc = Object.create(desc);
            findObjectNameRegExp.test(desc.module);
            var defaultName = RegExp.$1.replace(toCamelCaseRegExp, replaceToCamelCase);

            if (defaultName === desc.name) {
                newDesc.prototype = desc.module;
            } else {
                newDesc.prototype = desc.module + "[" + desc.name + "]";
            }

            delete desc.module;
            delete desc.name;

            for (var key in desc) {
                newDesc[key] = desc[key];
            }

            serialization[label] = newDesc;
        }
    }

    var string = JSON.stringify(serialization, null, 4);
    string = string.replace(/\{\s*"(@|#)"\s*:\s*"([^"]+)"\s*\}/g, '{"$1": "$2"}');

    return string;
}