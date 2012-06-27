/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Template = require("montage/ui/template").Template;

var Flatten = exports.Flatten = Montage.create(Component, {
    hasTemplate: {
        value: true
    },

    loadTemplate: {value: function(callback) {
        if (this._isTemplateLoading) return;
        this._isTemplateLoading = true;
        var self = this;
        var templateModuleId, info, moduleId;

        var onTemplateLoad = function(reel) {
            self._template = reel;
            self._isTemplateLoaded = true;
            self._isTemplateLoading = false;
            // TODO: only need to change this part on Component.loadTemplate to make it generic for any component, we need a way for a component to say they want to be expanded... at the moment we'll only use it for repetitions I'd say.
            reel.flatten(function() {
                reel.instantiateWithComponent(self);
                if (callback) {
                    callback();
                }
            });
        }

        templateModuleId = this.templateModuleId;
        if (!templateModuleId) {
            info = Montage.getInfoForObject(this);
            moduleId = info.moduleId;
            filename =  moduleId.split("/").pop();
            templateModuleId = info.moduleId + ".reel/" + filename + ".html"
        }
        Template.create().initWithModuleId(templateModuleId, onTemplateLoad);
    }}
});
