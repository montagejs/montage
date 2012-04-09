/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var findObjectNameRegExp = /([^\/]+?)(\.reel)?$/,
    toCamelCaseRegExp = /(?:^|-)([^-])/g,
    replaceToCamelCase = function(_, g1) { return g1.toUpperCase() };

exports.convertModuleToPrototype = function(string) {
    var regexp = /"module"\s*:\s*"([^"]+)"\s*,\s*"name"\s*:\s*"([^"]+)"/g;

    return string.replace(regexp, function(_, module, name) {
        findObjectNameRegExp.test(module);
        var defaultName = RegExp.$1.replace(toCamelCaseRegExp, replaceToCamelCase);

        return '"prototype": "' + module + (defaultName !== name ? '[' + name + ']' : '') + '"';
    });
}