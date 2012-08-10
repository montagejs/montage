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

// Super-duper-simple node app for handling Github OAuth messages

var express = require('express');
var oauth = require('./oauth');

var app = express.createServer();

var appDir = __dirname + "/app";
var port = 8888;

var clientId = "950ee812049179356e4d";
var clientSecret = "5f49aef362ad2b2ade243f15503aca43c5f1fdb1";
var githubOAuth = new oauth.OAuth2(clientId, clientSecret, "https://github.com/login");

app.use(express.bodyParser());
app.use(express.static(appDir));
app.use(express.directory(appDir));

app.post('/auth', function(req, res){
    var authCode = req.body.authCode;
    githubOAuth.getOAuthAccessToken(authCode, null, function(err, accessToken) {
        if(err) {
            console.error("Encountered an error while getting access token:", err);
            res.send(null);
            return;
        }
        console.log("Got Access Token: ", accessToken);
        res.send(JSON.stringify({accessToken: accessToken}));
    });

});

app.listen(port);

console.log("Mugshot Server is now listening on port", port);