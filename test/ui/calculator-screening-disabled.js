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
/*global script,Agent,Key,Mouse,assertEqual */
var config = script.require('config.js').config();
var agent = new Agent();

// Set script properties

script.setOption("exitOnFailure", false);
script.setOption("timeout", 1000);
script.setOption("sync.mode", "auto");

agent.gotoUrl(config.montage_url+"examples/calculator/index.html");
agent.setWindowSize(927, 985);

//Elements declaration
var bigNumber = agent.element("#currentEntry");
var smallNumbers = agent.element("#led");
var result = agent.element("#ledRes");
var memory = agent.element("/HTML/BODY/DIV/DIV/DIV/DIV/DIV");
var btn_mplus = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[1]/DIV[1]/DIV");
var btn_mminus = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[1]/DIV[2]/DIV");
var btn_mr = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[1]/DIV[3]/DIV");
var btn_div = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[1]/DIV[4]/DIV");
var btn_1 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[2]/DIV[1]/DIV/SPAN");
var btn_2 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[2]/DIV[2]/DIV/SPAN");
var btn_3 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[2]/DIV[3]/DIV/SPAN");
var btn_x = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[2]/DIV[4]/DIV");
var btn_4 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[3]/DIV[1]/DIV");
var btn_5 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[3]/DIV[2]/DIV/SPAN");
var btn_6 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[3]/DIV[3]/DIV");
var btn_plus = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[3]/DIV[4]/DIV");
var btn_7 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[4]/DIV[1]/DIV");
var btn_8 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[4]/DIV[2]/DIV/SPAN");
var btn_9 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[4]/DIV[3]/DIV/SPAN");
var btn_minus = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[4]/DIV[4]/DIV");
var btn_C = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[5]/DIV[1]/DIV/SPAN");
var btn_0 = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[5]/DIV[2]/DIV/SPAN");
var btn_dot = agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[5]/DIV[3]/DIV");
var btn_eq =  agent.element("/HTML/BODY/DIV/DIV[1]/DIV/DIV[2]/DIV/DIV[5]/DIV[4]/DIV");


btn_1.click();
btn_2.click();
btn_3.click();
btn_plus.click();
btn_6.click();
btn_5.click();
btn_4.click();
btn_eq.click();
assertEqual("777", bigNumber.getText());

btn_minus.click();
btn_7.click();
btn_7.click();
btn_eq.click();
assertEqual("700", bigNumber.getText());

btn_x.click();
btn_dot.click();
btn_1.click();
btn_eq.click();
assertEqual("70", bigNumber.getText());

btn_div.click();
btn_1.click();
btn_0.click();
btn_eq.click();
assertEqual("7", bigNumber.getText());

btn_x.click();
btn_eq.click();
assertEqual("49", bigNumber.getText());

btn_div.click();
btn_eq.click();
assertEqual("1", bigNumber.getText());

btn_C.click();
assertEqual("0", bigNumber.getText());

btn_5.click();
btn_plus.click();
btn_eq.click();
assertEqual("10", bigNumber.getText());

btn_minus.click();
btn_eq.click();
assertEqual("0", bigNumber.getText());

btn_1.click();
btn_0.click();
btn_0.click();
assertEqual("100", bigNumber.getText());

btn_C.click();
assertEqual("10", bigNumber.getText());

btn_C.mouseDown(5,5);
agent.wait(1500);
btn_C.mouseUp(5,5);
assertEqual("0", bigNumber.getText());

btn_5.click();
btn_mplus.click();
btn_8.click();
btn_mplus.click();
btn_mr.click();
assertEqual("13", bigNumber.getText());
assertEqual("M", memory.getText());

btn_mplus.click();
btn_mr.click();
assertEqual("26", bigNumber.getText());

btn_C.mouseDown(5,5);
agent.wait(1500);
btn_C.mouseUp(5,5);
assertEqual("0", bigNumber.getText());

btn_mr.mouseDown(5,5);
agent.wait(1500);
btn_mr.mouseUp(5,5);
assertEqual("", memory.getText());

btn_8.click();
btn_mminus.click();
btn_1.click();
btn_0.click();
btn_mplus.click();
btn_mr.click();
assertEqual("2", bigNumber.getText());
assertEqual("M", memory.getText());

btn_div.click();
btn_0.click();
btn_eq.click();
assertEqual("Error", bigNumber.getText());

btn_C.click();
assertEqual("0", bigNumber.getText());
