var DataService = require("montage/data/service/data-service").DataService,
    Authorization = require("spec/data/logic/authorization/authorization").Authorization,
    Promise = require("montage/core/promise").Promise;



exports.AuthorizationServiceB = DataService.specialize( /** @lends AuthorizationServiceB.prototype */ {

    authorization: {
        get: function () {
            if (!this._authorization) {
                this._authorization = new Authorization();
                this._authorization.isServiceB = true;
            }
            return this._authorization;
        }
    },

    providesAuthorization: {
        value: true
    },
    
    authorize: {
        value: function () {
            return this.promiseDescriptor.value;
        }
    },

    didLogOut: {
        value: false
    },

    logOut: {
        value: function () {
            this.didLogOut = true;
        }
    },

    reset: {
        value: function () {
            this._promiseDescriptor = this._makePromiseDescriptor();
        }
    },

    _makePromiseDescriptor: {
        value: function () {
            var descriptor = {};
            descriptor.value = new Promise(function (resolve, reject) {
                descriptor.resolve = resolve;
                descriptor.reject = reject;
            });
            return descriptor;
        }
    },


    promiseDescriptor: {
        get: function () {
            var self = this,
                descriptor;
           if (!this._promiseDescriptor) {
                this._promiseDescriptor = this._makePromiseDescriptor();
           } 
           return this._promiseDescriptor;
        }
    },

    resolve: {
        value: function () {
            this.promiseDescriptor.resolve(this.authorization);
        }
    },

    reject: {
        value: function () {
            this.promiseDescriptor.reject(new Error("Test AuthService Rejection"));
        }
    }
    

});
