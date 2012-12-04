var Montage = require("montage").Montage,
    logger = require("core/logger").logger("document-part"),
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

var DocumentPart = Montage.create(Montage, {
    template: {value: null},
    fragment: {value: null},
    objects: {value: null},
    childComponents: {value: null},

    initWithTemplateAndFragment: {
        value: function(template, fragment) {
            this.template = template;
            this.fragment = fragment;
            this.objects = null;
            this.childComponents = [];

            if (fragment) {
                defaultEventManager.registerEventHandlerForElement(this, fragment);
            }
        }
    },

    _addChildComponent: {
        value: function(childComponent) {
            this.childComponents.push(childComponent);
        }
    }
});

exports.DocumentPart = DocumentPart;