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
var agent = new Agent();

var config = script.require('config.js').config();
agent.gotoUrl(config.montage_url+"/examples/app-template/index.html");

agent.setWindowSize(927, 979);

while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the bootstrapper content which will now be shown for at least 1500ms.")
    agent.wait(1000);
while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the loader content which will now be shown for at least 2000ms.")
	agent.wait(1000);

assertEqual("Main component of application",agent.element("/HTML/BODY/DIV/P").getText());
assertEqual("Other component of application",agent.element("/HTML/BODY/DIV/DIV/P").getText());

agent.refresh();

while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the bootstrapper content which will now be shown for at least 1500ms.")
	agent.wait(1000);
while (agent.element("/HTML/BODY/DIV/P").getText() == "This is the loader content which will now be shown for at least 2000ms.")
    agent.wait(1000);

assertEqual("Main component of application",agent.element("/HTML/BODY/DIV/P").getText());
assertEqual("Other component of application",agent.element("/HTML/BODY/DIV/DIV/P").getText());
