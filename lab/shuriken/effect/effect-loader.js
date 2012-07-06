/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */


var Montage = require("montage/core/core").Montage;
var Template = require("montage/ui/template").Template;
var Effect = require("effect/effect").Effect;

EffectLoader = exports.EffectLoader = Montage.create(Montage, {
        
    loadEffect: {
        value: function (callback, name, templateModuleId, builtIn, context) {
			if (!this._isTemplateLoaded || !this._isTemplateLoading) {
                this._isTemplateLoading = true;
                var self = this;
                var info, filename;
                
                var onTemplateLoad = function(template) {
                    self._template = template;

                    template.instantiateWithOwnerAndDocument(null, window.document, function(ownerObject) {
                        ownerObject.name = name;
                        
                        if (callback) {
                            callback(ownerObject,context);
                        }
                        
                    });
                
                    self._isTemplateLoaded = true;
                    self._isTemplateLoading = false;
                };
				var requireInUse;
				if (builtIn) {
					info = Montage.getInfoForObject(this);
	                requireInUse = info.require;
				} else {
					requireInUse = window.require;
				}

                Template.templateWithModuleId(requireInUse, templateModuleId, onTemplateLoad);
            }        
        }
    },
     
});
