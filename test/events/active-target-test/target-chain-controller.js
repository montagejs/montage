var Montage = require("montage").Montage,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

exports.TargetChainController = Montage.specialize( {

    content: {
        value: null
    },

    constructor: {
        value: function () {
            this.addOwnPropertyChangeListener("content", this);
        }
    },

    handleContentChange: {
        value: function () {
            this.dispatchBeforeOwnPropertyChange("organizedContent", this.organizedContent);
            this._organizedContent = null;
            this.dispatchOwnPropertyChange("organizedContent", this.organizedContent);
        }
    },

    _organizedContent: {
        value: null
    },

    organizedContent: {
        get: function () {
            if (!this._organizedContent) {
                this._organizedContent = defaultEventManager._eventPathForTarget(this.content);
            }
            return this._organizedContent;
        }
    }

});
