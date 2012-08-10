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


var Montage = require("montage/core/core").Montage,
    JSONP = require("jsonp").JSONP;

function appendArgsToUrl(url, args) {
    if(!args) { return url; }
    var firstArg = url.indexOf("?") === -1;
    var key, value;
    for(key in args) {
        value = args[key];
        url = url + (firstArg ? "?" : "&") + key + "=" + value;
        firstArg = false;
    }
    return url;
}

function argsToQuerystring(args) {
    if(!args) { return url; }
    var firstArg = true;
    var key, value, out = "";
    for(key in args) {
        value = args[key];
        out = out + (firstArg ? "" : "&") + key + "=" + value;
        firstArg = false;
    }
    return out;
}

var GithubRepoApi = Montage.create(Montage, {
    accessToken: {
        value: null
    },

    user: {
        value: null
    },

    repo: {
        value: null
    },

    collaborators: {
        value: function(args, callback) {
            var url = appendArgsToUrl("https://api.github.com/repos/" + this.user + "/" + this.repo + "/collaborators?access_token=" + this.accessToken, args);
            JSONP.send("GET", url, null, function(response) {
                if(callback) { callback(response); }
            });
        }
    },

    milestones: {
        value: function(args, callback) {
            var url = appendArgsToUrl("https://api.github.com/repos/" + this.user + "/" + this.repo + "/milestones?access_token=" + this.accessToken, args);
            JSONP.send("GET", url, null, function(response) {
                if(callback) { callback(response); }
            });
        }
    },

    issues: {
        value: function(args, callback) {
            var url = appendArgsToUrl("https://api.github.com/repos/" + this.user + "/" + this.repo + "/issues?access_token=" + this.accessToken, args);
            JSONP.send("GET", url, null, function(response) {
                if(callback) { callback(response); }
            });
        }
    }
});

exports.GithubApi = Montage.create(Montage, {
    clientId: {
        value: "950ee812049179356e4d"
    },

    // I'm pretty sure that this access token is not intended to be stored client side, as copying it would probably give you free reign to imporsonate that user
    accessToken: {
        get: function() {
            return localStorage.getItem("githubAccessToken");
        },
        set: function(value) {
            localStorage.setItem("githubAccessToken", value);
        }
    },

    getLoginUrl: {
        value: function(args) {
            return appendArgsToUrl("https://github.com/login/oauth/authorize?client_id=" + this.clientId, args);
        }
    },

    authorize: {
        value: function(authCode, callback) {
            var self = this;

            var request = {
                authCode: authCode
            };

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/auth", true);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.addEventListener("load", function() {
                if(this.responseText) {
                    var obj = JSON.parse(this.responseText);
                    if(obj.accessToken) {
                        self.accessToken = obj.accessToken;
                        if(callback) { callback(); }
                        return;
                    }
                }

                console.error("Failed to authenticate with Github");
                if(callback) { callback(); }
            }, false);

            var requestStr = JSON.stringify(request);
            xhr.send(requestStr);
        }
    },

    logout: {
        value: function() {
            this.accessToken = null;
        }
    },

    repo: {
        value: function(user, repo) {
            var repoApi = GithubRepoApi.create();
            repoApi.user = user;
            repoApi.repo = repo;
            repoApi.accessToken = this.accessToken;
            return repoApi;
        }
    }
});