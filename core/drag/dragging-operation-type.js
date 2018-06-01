var Montage = require("../core").Montage;

var DraggingOperationType = exports.DraggingOperationType = Montage.specialize(null, {

    Default: {
        value: "default"
    },

    Copy: {
        value: "copy"
    },

    Move: {
        value: "move"
    },

    Link: {
        value: "alias"
    },

    CopyLink: {
        value: "copyLink"
    },

    CopyMove: {
        value: "copyMove"
    },

    LinkMove: {
        value: "linkMove"
    },

    All :{
        value: "all"
    },

    _ALLOWED_EFFECTS: {
        value: null
    },

    ALLOWED_EFFECTS: {
        get: function () {
            if (!this._ALLOWED_EFFECTS) {
                this._ALLOWED_EFFECTS = [
                    this.Default, 
                    this.Copy, 
                    this.Link, 
                    this.Move
                ];
            }

            return this._ALLOWED_EFFECTS;
        }
    },

    _ALLOWED_DROP_EFFECTS: {
        value: null
    },

    ALLOWED_DROP_EFFECTS: {
        get: function () {
            if (!this._ALLOWED_DROP_EFFECTS) {
                this._ALLOWED_DROP_EFFECTS = this.ALLOWED_EFFECTS.concat([
                    this.All, 
                    this.CopyMove, 
                    this.CopyLink, 
                    this.LinkMove
                ]);
            }

            return this._ALLOWED_DROP_EFFECTS;
        }
    }
});
