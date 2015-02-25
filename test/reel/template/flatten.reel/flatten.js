/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
exports = typeof exports !== "undefined" ? exports : {};

var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;
var Template = require("montage/core/template").Template;

var Flatten = exports.Flatten = Component.specialize( {
    hasTemplate: {
        value: true
    },

    loadTemplate: {value: function (callback) {
        if (this._isTemplateLoading) return;
        this._isTemplateLoading = true;
        var self = this;
        var templateModuleId, info, moduleId;

        var onTemplateLoad = function (reel) {
            self._template = reel;
            self._isTemplateLoaded = true;
            self._isTemplateLoading = false;
            // TODO: only need to change this part on Component.loadTemplate to make it generic for any component, we need a way for a component to say they want to be expanded... at the moment we'll only use it for repetitions I'd say.
            reel.flatten(function () {
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
        new Template().initWithModuleId(templateModuleId, onTemplateLoad);
    }}
});
