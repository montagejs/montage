
/**
    @module "montage/ui/autocomplete/result-item.reel"
*/
var Component = require("montage/ui/component").Component,
    Text = require("montage/ui/text.reel").Text;

/**
    @class module:"montage/ui/autocomplete/result-item.reel".ResultItem
    @extends module:"montage/ui/text.reel".Text
*/
exports.ResultItem = Text.specialize({

    textPropertyPath: {value: null},

    _object: {value: null},

    object: {
        get: function() {
            return this._object;
        },
        set: function(aValue) {
            if(aValue) {
               this._object = aValue;
            }
            if(this._object) {
                if(this.textPropertyPath) {
                    this.value = this._object[this.textPropertyPath];
                } else {
                    this.value = this._object;
                }
            }
        }
    }

});
