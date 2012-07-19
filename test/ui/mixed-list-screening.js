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

agent.gotoUrl(config.montage_url + "/examples/mixed-list/index.html");
test(["Slider", "Checkbox", "Toggle"]);
agent.gotoUrl(config.montage_url + "/examples/mixed-list/index-native-controls.html");
test(["RangeInput", "Checkbox", "ToggleButton"]);

function test(arrayComponents) {
    agent.setWindowSize(927, 956);

    assertEqual("Add", agent.element("//*[@data-montage-id='button']").getText());
    assertEqual(arrayComponents[2], agent.component("//*[@data-montage-id='content']/UL/LI[1]/*").getObjectName());

    var j = 2;
    var component;

    while (arrayComponents.length !== 0) {
        agent.element("//*[@data-montage-id='button']").click(Mouse.LEFT, 22, 6);
        agent.wait(1000);

        component = agent.component("//*[@data-montage-id='content']/UL/LI[" + j + "]/*").getObjectName();

        j++;

        var index = arrayComponents.indexOf(component);

        if (index != -1) arrayComponents.splice(index, 1);
    }
}
