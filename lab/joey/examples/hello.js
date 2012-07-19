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

require("../joey")
.contentType("text/plain") // all responses will have this content type
    // add this content-type header to all responses, and
    // fail to negotiate any other content type
    // (so if Accept: application/json, they’ll get a
    // 406 Not acceptable)
// begin routing at "/"
.route(function (match) {

    // no further path
    match("")
    .method("GET") // only respond to GET at this path
                   // other methods will have unsupported method responses
    .content("Hello, World!") // just say it; it’s static

    // the next path component is a name, no slash
    match(":name")
    .method("GET") // only respond to GET at this path
                   // other methods will have unsupported method responses
    // generate content based on the request.  we’ll transform it into a
    // response object on the way back to the server
    .contentApp(function (request) {
        return "Hello, " + request.params.name + "!";
    })

    // everything else is not found
})
.listen(8888)
.then(function (server) {
    console.log("Listening on", server.port)
})
.end()

