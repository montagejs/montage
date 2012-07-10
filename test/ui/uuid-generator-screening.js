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
var config = script.require('config.js').config();
// ==== Start Recorded Script, Tue Mar 06 2012 13:39:29 GMT-0800 (PST)====

var agent = new Agent();

agent.gotoUrl(config.montage_url+"/examples/uuid-generator/");

agent.setWindowSize(927, 974);

//Gererate 4 UUIDs, verify all are unique
agent.element("//*[@data-montage-id='generateUuid']").click(Mouse.LEFT,76,29);
agent.wait(1608);
agent.element("//*[@data-montage-id='generateUuid']").click(Mouse.LEFT,76,28);
agent.wait(1728);
agent.element("//*[@data-montage-id='generateUuid']").click(Mouse.LEFT,76,28);
agent.wait(1448);
agent.element("//*[@data-montage-id='generateUuid']").click(Mouse.LEFT,76,28);


var uuid1 = agent.element("/HTML/BODY/UL/LI[1]/INPUT").getText();
var uuid2 = agent.element("/HTML/BODY/UL/LI[2]/INPUT").getText();
var uuid3 = agent.element("/HTML/BODY/UL/LI[3]/INPUT").getText();
var uuid4 = agent.element("/HTML/BODY/UL/LI[4]/INPUT").getText();

assertNotEqual(uuid1, uuid2);
assertNotEqual(uuid1, uuid3);
assertNotEqual(uuid1, uuid4);
assertNotEqual(uuid2, uuid3);
assertNotEqual(uuid2, uuid4);
assertNotEqual(uuid3, uuid4);

//Refresh page, make sure all UUIDs are gone
agent.refresh();

assertFalse (agent.doesElementExist("/HTML/BODY/UL/LI[1]/INPUT"));
assertFalse (agent.doesElementExist("/HTML/BODY/UL/LI[2]/INPUT"));
assertFalse (agent.doesElementExist("/HTML/BODY/UL/LI[3]/INPUT"));
assertFalse (agent.doesElementExist("/HTML/BODY/UL/LI[4]/INPUT"));

