var Component = require("../component").Component;

exports.List = Component.specialize({

    /**
     Description TODO
     @private
     */
    _repetition: {
        value: null
    },

    _scroller: {
        value: null
    },

    /**
     Description TODO
     @type {Property}
     @default null
     */
    delegate: {
        value: null
    },

    content: {
        value: null
    },

    contentController: {
        value: null
    },

    axis: {
        value: null
    },

    /**
     Description TODO
     @private
     */
    isSelectionEnabled: {
        value: null
    },

    /**
     * Threshold at which the list will fire a "listEnd" event. This is the ratio of
     */
    listEndEventThreshold: {
        value: 1
    },


    _fireEndEvent: {
        value: function() {
            this.dispatchEventNamed("listEnd");
        }
    },

    handlePropertyChange: {
        value: function(changeValue, key, object) {
            if (key === "scrollY" || key === "_maxTranslateY") {
                if (this._scroller && object === this._scroller) {
                    if (this._scroller.scrollY >=
                        (this._scroller._maxTranslateY * this.listEndEventThreshold) &&
                        this._scroller._maxTranslateY > 0
                    ) {
                        this._fireEndEvent();
                    }
                }
            }
        }
    }

});
