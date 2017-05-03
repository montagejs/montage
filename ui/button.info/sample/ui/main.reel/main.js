var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize(/** @lends Main# */ {

    message: {
        value: null
    },

    handleAction: {
        value: function (event) {
            this.message = event.target.identifier + " button has been clicked";
        }
    },

    handleLongAction: {
        value: function (event) {
            this.message = event.target.identifier + " button has been clicked (long action)";
        }
    },

    handlePromiseButtonAction: {
        value: function (event) {
            var self = this;

            this.message = "Promise is pending resolution";
        
            this.promiseButton.promise = new Promise(function(resolve){
                setTimeout(function(){
                    resolve();
                }, 2000)
            }).then(function(){
                self.message = "First promise resolved!"
            });

            this.promiseButton.promise = new Promise(function(resolve){
                setTimeout(function(){
                    resolve();
                }, 5000)
            }).then(function(){
                self.message = "Second promise resolved!"
            });
        }
    }
});
