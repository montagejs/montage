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
// ==== Start Recorded Script, Fri Mar 09 2012 15:50:43 GMT-0800 (PST)====

var agent = new Agent();

var config = script.require('config.js').config();
agent.gotoUrl(config.montage_url+"/examples/photofx/index.html");
agent.wait(2000);

agent.setWindowSize(1145, 978);

//Verify scrolling of images works
var scrollerComponent = agent.component("/html/body/div/div[4]/div/div");
assertEqual(0, scrollerComponent.getProperty("scrollX"));

agent.wait(2000);
agent.mouseDown(102,879);
agent.mouseMove([{"x":103,"y":879,"duration":0},{"x":857,"y":888,"duration":1461},{"x":1749,"y":857,"duration":879},{"x":1892,"y":850,"duration":183},{"x":3000,"y":843,"duration":429}]);
//might fail - drag-n-drop issue. Bug #3
assertEqual(-755, scrollerComponent.getProperty("scrollX"));

agent.mouseUp(3000,843);
agent.wait(2000);
assertEqual(0, scrollerComponent.getProperty("scrollX"));

agent.mouseMove([{"x":1020,"y":878,"duration":0},{"x":743,"y":895,"duration":51},{"x":514,"y":899,"duration":45},{"x":417,"y":909,"duration":50},{"x":228,"y":906,"duration":217},{"x":269,"y":897,"duration":116},{"x":512,"y":910,"duration":151},{"x":552,"y":908,"duration":50},{"x":560,"y":901,"duration":83},{"x":633,"y":902,"duration":851}]);
agent.mouseDown(633,902);
agent.mouseMove([{"x":632,"y":902,"duration":0},{"x":362,"y":903,"duration":371},{"x":-11,"y":883,"duration":335},{"x":-22,"y":881,"duration":15},{"x":-22,"y":869,"duration":1046}]);
assertEqual(271, scrollerComponent.getProperty("scrollX"));

agent.mouseUp(-22,869);
agent.wait(2000);
assertEqual(0, scrollerComponent.getProperty("scrollX"));

//Verify initial toggle settings
assertEqual("OFF",agent.element("//*[@data-montage-id='invertToggle']").getText());
assertEqual("OFF",agent.element("//*[@data-montage-id='desaturateToggle']").getText());
assertEqual("OFF",agent.element("//*[@data-montage-id='toggle']").getText());
assertEqual("1",agent.element("/HTML/BODY/DIV/DIV[3]/UL/LI[3]/DIV/DIV[1]/DIV").getText());

//Remove an image
agent.element("//*[@data-montage-id='content']/DIV/DIV[4]/IMG").click();
agent.element("//*[@data-montage-id='removePhotoButton']").click(Mouse.LEFT,84,13);
assertFalse (agent.doesElementExist("//*[@data-montage-id='content']/DIV/DIV[4]/IMG"));

agent.element("//*[@data-montage-id='undoButton']").click();
agent.wait(2000);
assertTrue (agent.doesElementExist("//*[@data-montage-id='content']/DIV/DIV[4]/IMG"));

agent.element("//*[@data-montage-id='redoButton']").click(Mouse.LEFT,144,16);
agent.wait(2000);

assertFalse (agent.doesElementExist("//*[@data-montage-id='content']/DIV/DIV[4]/IMG"));

agent.refresh();
agent.wait(2000);

//Declare variables (after refresh)

var invertToggle = agent.element("//*[@data-montage-id='invertToggle']");
var desaturateToggle = agent.element("//*[@data-montage-id='desaturateToggle']");
var toggle = agent.element("//*[@data-montage-id='toggle']");
var toggleControlsButton = agent.element("//*[@data-montage-id='toggleControlsButton']");
var UndoButton = agent.element("//*[@data-montage-id='undoButton']");
var redoButton = agent.element("//*[@data-montage-id='redoButton']");
var multValue = agent.element("/HTML/BODY/DIV/DIV[3]/UL/LI[3]/DIV/DIV[1]/DIV");

var R1_el = agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[2]/div/div/dl/dd[1]");
var G1_el = agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[2]/div/div/dl/dd[2]");
var B1_el = agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[2]/div/div/dl/dd[3]");
var X1_el = agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[3]/div/div/dl/dd[1]");
var Y1_el = agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[3]/div/div/dl/dd[2]");

var R2_el = agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[2]/div/div/dl/dd[1]");
var G2_el = agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[2]/div/div/dl/dd[2]");
var B2_el = agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[2]/div/div/dl/dd[3]");
var X2_el = agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[3]/div/div/dl/dd[1]");
var Y2_el = agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[3]/div/div/dl/dd[2]");

var R3_el = agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[2]/div/div/dl/dd[1]");
var G3_el = agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[2]/div/div/dl/dd[2]");
var B3_el = agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[2]/div/div/dl/dd[3]");
var X3_el = agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[3]/div/div/dl/dd[1]");
var Y3_el = agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[3]/div/div/dl/dd[2]");

var R4_el = agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[2]/div/div/dl/dd[1]");
var G4_el = agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[2]/div/div/dl/dd[2]");
var B4_el = agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[2]/div/div/dl/dd[3]");
var X4_el = agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[3]/div/div/dl/dd[1]");
var Y4_el = agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[3]/div/div/dl/dd[2]");


assertFalse (agent.doesElementExist("//*[@data-montage-id='content']/DIV/DIV[4]/IMG"));


//Add an image
agent.element("//*[@data-montage-id='addPhotosButton']").click();
agent.wait(2000);
agent.element("//*[@data-montage-id='searchButton']").click();
agent.wait(2000);

var imgListComponent = agent.component("//*[@data-montage-id='popup-wrapper']/DIV/DIV/DIV/DIV[2]/DIV");
assertEqual(0, imgListComponent.getProperty("scrollY"));

agent.mouseDown(519,429);
agent.mouseMove([{"x":519,"y":430,"duration":0},{"x":495,"y":644,"duration":317},{"x":495,"y":769,"duration":200},{"x":508,"y":845,"duration":533}]);
assertEqual(-208, imgListComponent.getProperty("scrollY"));

agent.mouseUp(508,845);
agent.wait(2000);
assertEqual(0, imgListComponent.getProperty("scrollY"));


agent.element("//*[@data-montage-id='addPhotoButton']").click(Mouse.LEFT,25,16);
agent.wait(2000);

assertTrue (agent.doesElementExist("//*[@data-montage-id='alreadyAddedNotice']"));
agent.wait (2000);

assertTrue (agent.doesElementExist("//*[@data-montage-id='content']/DIV/DIV[4]/IMG"));

//Test 'pencil' icon
assertEqual ("PhotoFX main showControls", agent.element("/html/body/div").getAttribute("class"));
toggleControlsButton.click(Mouse.LEFT,14,15);
assertEqual ("PhotoFX main", agent.element("/html/body/div").getAttribute("class"));
toggleControlsButton.click(Mouse.LEFT,14,15);
assertEqual ("PhotoFX main showControls", agent.element("/html/body/div").getAttribute("class"));

agent.setWindowSize(1360, 961);

agent.mouseMove([{"x":1353,"y":952,"duration":0},{"x":1323,"y":894,"duration":74},{"x":1275,"y":766,"duration":84},{"x":1235,"y":592,"duration":66},{"x":1211,"y":381,"duration":83},{"x":1172,"y":227,"duration":133},{"x":1144,"y":173,"duration":217},{"x":1127,"y":172,"duration":283},{"x":1112,"y":161,"duration":334}]);
agent.mouseDown(1112,161);
agent.wait(702);
agent.mouseMove([{"x":1315,"y":163,"duration":200}]);
agent.mouseUp(1315,163);
agent.wait(200);

assertEqual ("btn UndoButton", UndoButton.getAttribute("class"));
assertEqual("20",multValue.getText());
assertEqual ("btn RedoButton disabled", redoButton.getAttribute("class"));
UndoButton.click();
assertEqual("1",multValue.getText());
assertEqual ("btn RedoButton", redoButton.getAttribute("class"));
assertEqual ("btn UndoButton disabled", UndoButton.getAttribute("class"));

agent.element("//*[@data-montage-id='redoButton']").click();
assertEqual("20",multValue.getText());
assertEqual ("btn RedoButton disabled", redoButton.getAttribute("class"));
assertEqual ("btn UndoButton", UndoButton.getAttribute("class"));

agent.element("//*[@data-montage-id='undoButton']").click();
assertEqual("1",multValue.getText());
assertEqual ("btn RedoButton", redoButton.getAttribute("class"));
assertEqual ("btn UndoButton disabled", UndoButton.getAttribute("class"));

//Select an image
agent.element("//*[@data-montage-id='content']/div/div[2]/img").click();
var img = agent.element("//*[@data-montage-id='content']/div/div[2]/img").getAttribute("src");
assertEqual (img, agent.element("//*[@data-montage-id='image']").getAttribute("src"));

agent.setWindowSize(1356, 981);

agent.element("/HTML/BODY/DIV/DIV[3]/DIV[1]/DIV/DIV[1]").click(Mouse.LEFT,72,20);
agent.wait(1000);
agent.element("/HTML/BODY/DIV/DIV[2]/DIV[2]/DIV/CANVAS").click(Mouse.LEFT,289,500);
agent.wait(1000);

agent.element("/HTML/BODY/DIV/DIV[3]/DIV[1]/DIV/DIV[2]").click(Mouse.LEFT,56,20);
agent.wait(1000);
agent.element("/HTML/BODY/DIV/DIV[2]/DIV[2]/DIV/CANVAS").click(Mouse.LEFT,510,441);
agent.wait(1000);

agent.element("/HTML/BODY/DIV/DIV[3]/DIV[1]/DIV/DIV[3]").click(Mouse.LEFT,143,21);
agent.wait(1000);
agent.element("/HTML/BODY/DIV/DIV[2]/DIV[2]/DIV/CANVAS").click(Mouse.LEFT,322,324);

agent.wait(1000);

agent.element("/HTML/BODY/DIV/DIV[3]/DIV[1]/DIV/DIV[4]").click(Mouse.LEFT,94,17);
agent.wait(1000);
agent.element("/HTML/BODY/DIV/DIV[2]/DIV[2]/DIV/CANVAS").click(Mouse.LEFT,272,441);

agent.wait(1000);

//Get RGB and XY values
var R1 = R1_el.getText();
var G1 = G1_el.getText();
var B1 = B1_el.getText();
var X1 = X1_el.getText();
var Y1 = Y1_el.getText();

var R2 = R2_el.getText();
var G2 = G2_el.getText();
var B2 = B2_el.getText();
var X2 = X2_el.getText();
var Y2 = Y2_el.getText();

var R3 = R3_el.getText();
var G3 = G3_el.getText();
var B3 = B3_el.getText();
var X3 = X3_el.getText();
var Y3 = Y3_el.getText();

var R4 = R4_el.getText();
var G4 = G4_el.getText();
var B4 = B4_el.getText();
var X4 = X4_el.getText();
var Y4 = Y4_el.getText();


UndoButton.click();
UndoButton.click();
UndoButton.click();
UndoButton.click();

assertEqual("", R1_el.getText());
assertEqual("", G1_el.getText());
assertEqual("", B1_el.getText());
assertEqual("", X1_el.getText());
assertEqual("", Y1_el.getText());

assertEqual("", R2_el.getText());
assertEqual("", G2_el.getText());
assertEqual("", B2_el.getText());
assertEqual("", X2_el.getText());
assertEqual("", Y2_el.getText());

assertEqual("", R3_el.getText());
assertEqual("", G3_el.getText());
assertEqual("", B3_el.getText());
assertEqual("", X3_el.getText());
assertEqual("", Y3_el.getText());

assertEqual("", R4_el.getText());
assertEqual("", G4_el.getText());
assertEqual("", B4_el.getText());
assertEqual("", X4_el.getText());
assertEqual("", Y4_el.getText());

assertEqual ("btn UndoButton disabled", UndoButton.getAttribute("class"));

redoButton.click();
redoButton.click();
redoButton.click();
redoButton.click();


assertEqual(R1, R1_el.getText());
assertEqual(G1, G1_el.getText());
assertEqual(B1, B1_el.getText());
assertEqual(X1, X1_el.getText());
assertEqual(Y1, Y1_el.getText());

assertEqual(R2, R2_el.getText());
assertEqual(G2, G2_el.getText());
assertEqual(B2, B2_el.getText());
assertEqual(X2, X2_el.getText());
assertEqual(Y2, Y2_el.getText());

assertEqual(R3, R3_el.getText());
assertEqual(G3, G3_el.getText());
assertEqual(B3, B3_el.getText());
assertEqual(X3, X3_el.getText());
assertEqual(Y3, Y3_el.getText());

assertEqual(R4, R4_el.getText());
assertEqual(G4, G4_el.getText());
assertEqual(B4, B4_el.getText());
assertEqual(X4, X4_el.getText());
assertEqual(Y4, Y4_el.getText());

assertEqual ("btn RedoButton disabled", redoButton.getAttribute("class"));

//Set Invert Colors to ON
invertToggle.click();

var R1_invON = R1_el.getText();
var G1_invON = G1_el.getText();
var B1_invON = B1_el.getText();
var X1_invON = X1_el.getText();
var Y1_invON = Y1_el.getText();

var R2_invON = R2_el.getText();
var G2_invON = G2_el.getText();
var B2_invON = B2_el.getText();
var X2_invON = X2_el.getText();
var Y2_invON = Y2_el.getText();

var R3_invON = R3_el.getText();
var G3_invON = G3_el.getText();
var B3_invON = B3_el.getText();
var X3_invON = X3_el.getText();
var Y3_invON = Y3_el.getText();

var R4_invON = R4_el.getText();
var G4_invON = G4_el.getText();
var B4_invON = B4_el.getText();
var X4_invON = X4_el.getText();
var Y4_invON = Y4_el.getText();

assertNotEqual(R1, R1_invON);
assertNotEqual(G1, G1_invON);
assertNotEqual(B1, B1_invON);
assertEqual(X1, X1_invON);
assertEqual(Y1, Y1_invON);
assertNotEqual(R2, R2_invON);
assertNotEqual(G2, G2_invON);
assertNotEqual(B2, B2_invON);
assertEqual(X2, X2_invON);
assertEqual(Y2, Y2_invON);
assertNotEqual(R3, R3_invON);
assertNotEqual(G3, G3_invON);
assertNotEqual(B3, B3_invON);
assertEqual(X3, X3_invON);
assertEqual(Y3, Y3_invON);
assertNotEqual(R4, R4_invON);
assertNotEqual(G4, G4_invON);
assertNotEqual(B4, B4_invON);
assertEqual(X4, X4_invON);
assertEqual(Y4, Y4_invON);


//Move slider to 20, RGBs do not change
agent.mouseDown(1110,161);
agent.mouseMove([{"x":1347,"y":171,"duration":133}]);
agent.mouseUp(1347,171);
assertEqual("20",multValue.getText());

assertEqual(R1_invON, R1_el.getText());
assertEqual(G1_invON, G1_el.getText());
assertEqual(B1_invON, B1_el.getText());
assertEqual(X1_invON, X1_el.getText());
assertEqual(Y1_invON, Y1_el.getText());

assertEqual(R2_invON, R2_el.getText());
assertEqual(G2_invON, G2_el.getText());
assertEqual(B2_invON, B2_el.getText());
assertEqual(X2_invON, X2_el.getText());
assertEqual(Y2_invON, Y2_el.getText());

assertEqual(R3_invON, R3_el.getText());
assertEqual(G3_invON, G3_el.getText());
assertEqual(B3_invON, B3_el.getText());
assertEqual(X3_invON, X3_el.getText());
assertEqual(Y3_invON, Y3_el.getText());

assertEqual(R4_invON, R4_el.getText());
assertEqual(G4_invON, G4_el.getText());
assertEqual(B4_invON, B4_el.getText());
assertEqual(X4_invON, X4_el.getText());
assertEqual(Y4_invON, Y4_el.getText());

//Move slider to 1, RGBs do not change

agent.mouseDown(1305,162);
agent.mouseMove([{"x":1081,"y":157,"duration":167}]);
agent.mouseUp(1081,157);

assertEqual("1",multValue.getText());

assertEqual(R1_invON, R1_el.getText());
assertEqual(G1_invON, G1_el.getText());
assertEqual(B1_invON, B1_el.getText());
assertEqual(X1_invON, X1_el.getText());
assertEqual(Y1_invON, Y1_el.getText());

assertEqual(R2_invON, R2_el.getText());
assertEqual(G2_invON, G2_el.getText());
assertEqual(B2_invON, B2_el.getText());
assertEqual(X2_invON, X2_el.getText());
assertEqual(Y2_invON, Y2_el.getText());

assertEqual(R3_invON, R3_el.getText());
assertEqual(G3_invON, G3_el.getText());
assertEqual(B3_invON, B3_el.getText());
assertEqual(X3_invON, X3_el.getText());
assertEqual(Y3_invON, Y3_el.getText());

assertEqual(R4_invON, R4_el.getText());
assertEqual(G4_invON, G4_el.getText());
assertEqual(B4_invON, B4_el.getText());
assertEqual(X4_invON, X4_el.getText());
assertEqual(Y4_invON, Y4_el.getText());

//Set Desaturate to ON
desaturateToggle.click();

var R1_invON_desON = R1_el.getText();
var G1_invON_desON = G1_el.getText();
var B1_invON_desON = B1_el.getText();
var X1_invON_desON = X1_el.getText();
var Y1_invON_desON = Y1_el.getText();

var R2_invON_desON = R2_el.getText();
var G2_invON_desON = G2_el.getText();
var B2_invON_desON = B2_el.getText();
var X2_invON_desON = X2_el.getText();
var Y2_invON_desON = Y2_el.getText();

var R3_invON_desON = R3_el.getText();
var G3_invON_desON = G3_el.getText();
var B3_invON_desON = B3_el.getText();
var X3_invON_desON = X3_el.getText();
var Y3_invON_desON = Y3_el.getText();

var R4_invON_desON = R4_el.getText();
var G4_invON_desON = G4_el.getText();
var B4_invON_desON = B4_el.getText();
var X4_invON_desON = X4_el.getText();
var Y4_invON_desON = Y4_el.getText();

assertNotEqual(R1, R1_invON_desON);
assertNotEqual(G1, G1_invON_desON);
assertNotEqual(B1, B1_invON_desON);
assertEqual(X1, X1_invON_desON);
assertEqual(Y1, Y1_invON_desON);
assertNotEqual(R2, R2_invON_desON);
assertNotEqual(G2, G2_invON_desON);
assertNotEqual(B2, B2_invON_desON);
assertEqual(X2, X2_invON_desON);
assertEqual(Y2, Y2_invON_desON);
assertNotEqual(R3, R3_invON_desON);
assertNotEqual(G3, G3_invON_desON);
assertNotEqual(B3, B3_invON_desON);
assertEqual(X3, X3_invON_desON);
assertEqual(Y3, Y3_invON_desON);
assertNotEqual(R4, R4_invON_desON);
assertNotEqual(G4, G4_invON_desON);
assertNotEqual(B4, B4_invON_desON);
assertEqual(X4, X4_invON_desON);
assertEqual(Y4, Y4_invON_desON);


assertNotEqual(R1_invON, R1_invON_desON);
assertNotEqual(G1_invON, G1_invON_desON);
assertNotEqual(B1_invON, B1_invON_desON);
assertEqual(X1_invON, X1_invON_desON);
assertEqual(Y1_invON, Y1_invON_desON);
assertNotEqual(R2_invON, R2_invON_desON);
assertNotEqual(G2_invON, G2_invON_desON);
assertNotEqual(B2_invON, B2_invON_desON);
assertEqual(X2_invON, X2_invON_desON);
assertEqual(Y2_invON, Y2_invON_desON);
assertNotEqual(R3_invON, R3_invON_desON);
assertNotEqual(G3_invON, G3_invON_desON);
assertNotEqual(B3_invON, B3_invON_desON);
assertEqual(X3_invON, X3_invON_desON);
assertEqual(Y3_invON, Y3_invON_desON);
assertNotEqual(R4_invON, R4_invON_desON);
assertNotEqual(G4_invON, G4_invON_desON);
assertNotEqual(B4_invON, B4_invON_desON);
assertEqual(X4_invON, X4_invON_desON);
assertEqual(Y4_invON, Y4_invON_desON);


//Move slider to 20, RGBs do not change

agent.mouseDown(1110,161);
agent.mouseMove([{"x":1347,"y":171,"duration":133}]);
agent.mouseUp(1347,171);
assertEqual("20",multValue.getText());

assertEqual(R1_invON_desON, R1_el.getText());
assertEqual(G1_invON_desON, G1_el.getText());
assertEqual(B1_invON_desON, B1_el.getText());
assertEqual(X1_invON_desON, X1_el.getText());
assertEqual(Y1_invON_desON, Y1_el.getText());

assertEqual(R2_invON_desON, R2_el.getText());
assertEqual(G2_invON_desON, G2_el.getText());
assertEqual(B2_invON_desON, B2_el.getText());
assertEqual(X2_invON_desON, X2_el.getText());
assertEqual(Y2_invON_desON, Y2_el.getText());

assertEqual(R3_invON_desON, R3_el.getText());
assertEqual(G3_invON_desON, G3_el.getText());
assertEqual(B3_invON_desON, B3_el.getText());
assertEqual(X3_invON_desON, X3_el.getText());
assertEqual(Y3_invON_desON, Y3_el.getText());

assertEqual(R4_invON_desON, R4_el.getText());
assertEqual(G4_invON_desON, G4_el.getText());
assertEqual(B4_invON_desON, B4_el.getText());
assertEqual(X4_invON_desON, X4_el.getText());
assertEqual(Y4_invON_desON, Y4_el.getText());

//Move slider to 1, RGBs do not change

agent.mouseDown(1305,162);
agent.mouseMove([{"x":1081,"y":157,"duration":167}]);
agent.mouseUp(1081,157);

assertEqual("1",multValue.getText());

assertEqual(R1_invON_desON, R1_el.getText());
assertEqual(G1_invON_desON, G1_el.getText());
assertEqual(B1_invON_desON, B1_el.getText());
assertEqual(X1_invON_desON, X1_el.getText());
assertEqual(Y1_invON_desON, Y1_el.getText());

assertEqual(R2_invON_desON, R2_el.getText());
assertEqual(G2_invON_desON, G2_el.getText());
assertEqual(B2_invON_desON, B2_el.getText());
assertEqual(X2_invON_desON, X2_el.getText());
assertEqual(Y2_invON_desON, Y2_el.getText());

assertEqual(R3_invON_desON, R3_el.getText());
assertEqual(G3_invON_desON, G3_el.getText());
assertEqual(B3_invON_desON, B3_el.getText());
assertEqual(X3_invON_desON, X3_el.getText());
assertEqual(Y3_invON_desON, Y3_el.getText());

assertEqual(R4_invON_desON, R4_el.getText());
assertEqual(G4_invON_desON, G4_el.getText());
assertEqual(B4_invON_desON, B4_el.getText());
assertEqual(X4_invON_desON, X4_el.getText());
assertEqual(Y4_invON_desON, Y4_el.getText());

//Set Multiply to ON

toggle.click();
assertEqual("1",multValue.getText());

assertEqual(R1_invON_desON, R1_el.getText());
assertEqual(G1_invON_desON, G1_el.getText());
assertEqual(B1_invON_desON, B1_el.getText());
assertEqual(X1_invON_desON, X1_el.getText());
assertEqual(Y1_invON_desON, Y1_el.getText());

assertEqual(R2_invON_desON, R2_el.getText());
assertEqual(G2_invON_desON, G2_el.getText());
assertEqual(B2_invON_desON, B2_el.getText());
assertEqual(X2_invON_desON, X2_el.getText());
assertEqual(Y2_invON_desON, Y2_el.getText());

assertEqual(R3_invON_desON, R3_el.getText());
assertEqual(G3_invON_desON, G3_el.getText());
assertEqual(B3_invON_desON, B3_el.getText());
assertEqual(X3_invON_desON, X3_el.getText());
assertEqual(Y3_invON_desON, Y3_el.getText());

assertEqual(R4_invON_desON, R4_el.getText());
assertEqual(G4_invON_desON, G4_el.getText());
assertEqual(B4_invON_desON, B4_el.getText());
assertEqual(X4_invON_desON, X4_el.getText());
assertEqual(Y4_invON_desON, Y4_el.getText());

//Move slider to 20, RGBs change
agent.mouseDown(1110,161);
agent.mouseMove([{"x":1347,"y":171,"duration":133}]);
agent.mouseUp(1347,171);
assertEqual("20",multValue.getText());

var R1_invON_desON_mult20 = R1_el.getText();
var G1_invON_desON_mult20 = G1_el.getText();
var B1_invON_desON_mult20 = B1_el.getText();
var X1_invON_desON_mult20 = X1_el.getText();
var Y1_invON_desON_mult20 = Y1_el.getText();

var R2_invON_desON_mult20 = R2_el.getText();
var G2_invON_desON_mult20 = G2_el.getText();
var B2_invON_desON_mult20 = B2_el.getText();
var X2_invON_desON_mult20 = X2_el.getText();
var Y2_invON_desON_mult20 = Y2_el.getText();

var R3_invON_desON_mult20 = R3_el.getText();
var G3_invON_desON_mult20 = G3_el.getText();
var B3_invON_desON_mult20 = B3_el.getText();
var X3_invON_desON_mult20 = X3_el.getText();
var Y3_invON_desON_mult20 = Y3_el.getText();

var R4_invON_desON_mult20 = R4_el.getText();
var G4_invON_desON_mult20 = G4_el.getText();
var B4_invON_desON_mult20 = B4_el.getText();
var X4_invON_desON_mult20 = X4_el.getText();
var Y4_invON_desON_mult20 = Y4_el.getText();

assertNotEqual(R1, R1_invON_desON_mult20);
assertNotEqual(G1, G1_invON_desON_mult20);
assertNotEqual(B1, B1_invON_desON_mult20);
assertEqual(X1, X1_invON_desON_mult20);
assertEqual(Y1, Y1_invON_desON_mult20);
assertNotEqual(R2, R2_invON_desON_mult20);
assertNotEqual(G2, G2_invON_desON_mult20);
assertNotEqual(B2, B2_invON_desON_mult20);
assertEqual(X2, X2_invON_desON_mult20);
assertEqual(Y2, Y2_invON_desON_mult20);
assertNotEqual(R3, R3_invON_desON_mult20);
assertNotEqual(G3, G3_invON_desON_mult20);
assertNotEqual(B3, B3_invON_desON_mult20);
assertEqual(X3, X3_invON_desON_mult20);
assertEqual(Y3, Y3_invON_desON_mult20);
assertNotEqual(R4, R4_invON_desON_mult20);
assertNotEqual(G4, G4_invON_desON_mult20);
assertNotEqual(B4, B4_invON_desON_mult20);
assertEqual(X4, X4_invON_desON_mult20);
assertEqual(Y4, Y4_invON_desON_mult20);

assertNotEqual(R1_invON, R1_invON_desON_mult20);
assertNotEqual(G1_invON, G1_invON_desON_mult20);
assertNotEqual(B1_invON, B1_invON_desON_mult20);
assertEqual(X1_invON, X1_invON_desON_mult20);
assertEqual(Y1_invON, Y1_invON_desON_mult20);
assertNotEqual(R2_invON, R2_invON_desON_mult20);
assertNotEqual(G2_invON, G2_invON_desON_mult20);
assertNotEqual(B2_invON, B2_invON_desON_mult20);
assertEqual(X2_invON, X2_invON_desON_mult20);
assertEqual(Y2_invON, Y2_invON_desON_mult20);
assertNotEqual(R3_invON, R3_invON_desON_mult20);
assertNotEqual(G3_invON, G3_invON_desON_mult20);
assertNotEqual(B3_invON, B3_invON_desON_mult20);
assertEqual(X3_invON, X3_invON_desON_mult20);
assertEqual(Y3_invON, Y3_invON_desON_mult20);
assertNotEqual(R4_invON, R4_invON_desON_mult20);
assertNotEqual(G4_invON, G4_invON_desON_mult20);
assertNotEqual(B4_invON, B4_invON_desON_mult20);
assertEqual(X4_invON, X4_invON_desON_mult20);
assertEqual(Y4_invON, Y4_invON_desON_mult20);

assertNotEqual(R1_invON_desON, R1_invON_desON_mult20);
assertNotEqual(G1_invON_desON, G1_invON_desON_mult20);
assertNotEqual(B1_invON_desON, B1_invON_desON_mult20);
assertEqual(X1_invON_desON, X1_invON_desON_mult20);
assertEqual(Y1_invON_desON, Y1_invON_desON_mult20);
assertNotEqual(R2_invON_desON, R2_invON_desON_mult20);
assertNotEqual(G2_invON_desON, G2_invON_desON_mult20);
assertNotEqual(B2_invON_desON, B2_invON_desON_mult20);
assertEqual(X2_invON_desON, X2_invON_desON_mult20);
assertEqual(Y2_invON_desON, Y2_invON_desON_mult20);
assertNotEqual(R3_invON_desON, R3_invON_desON_mult20);
assertNotEqual(G3_invON_desON, G3_invON_desON_mult20);
assertNotEqual(B3_invON_desON, B3_invON_desON_mult20);
assertEqual(X3_invON_desON, X3_invON_desON_mult20);
assertEqual(Y3_invON_desON, Y3_invON_desON_mult20);
assertNotEqual(R4_invON_desON, R4_invON_desON_mult20);
assertNotEqual(G4_invON_desON, G4_invON_desON_mult20);
assertNotEqual(B4_invON_desON, B4_invON_desON_mult20);
assertEqual(X4_invON_desON, X4_invON_desON_mult20);
assertEqual(Y4_invON_desON, Y4_invON_desON_mult20);


//Move slider to 1, RGBs change

agent.mouseDown(1305,162);
agent.mouseMove([{"x":1081,"y":157,"duration":167}]);
agent.mouseUp(1081,157);

assertEqual("1",multValue.getText());

assertEqual(R1_invON_desON, R1_el.getText());
assertEqual(G1_invON_desON, G1_el.getText());
assertEqual(B1_invON_desON, B1_el.getText());
assertEqual(X1_invON_desON, X1_el.getText());
assertEqual(Y1_invON_desON, Y1_el.getText());

assertEqual(R2_invON_desON, R2_el.getText());
assertEqual(G2_invON_desON, G2_el.getText());
assertEqual(B2_invON_desON, B2_el.getText());
assertEqual(X2_invON_desON, X2_el.getText());
assertEqual(Y2_invON_desON, Y2_el.getText());

assertEqual(R3_invON_desON, R3_el.getText());
assertEqual(G3_invON_desON, G3_el.getText());
assertEqual(B3_invON_desON, B3_el.getText());
assertEqual(X3_invON_desON, X3_el.getText());
assertEqual(Y3_invON_desON, Y3_el.getText());

assertEqual(R4_invON_desON, R4_el.getText());
assertEqual(G4_invON_desON, G4_el.getText());
assertEqual(B4_invON_desON, B4_el.getText());
assertEqual(X4_invON_desON, X4_el.getText());
assertEqual(Y4_invON_desON, Y4_el.getText());

//Set Desaturate to OFF
desaturateToggle.click();

assertEqual(R1_invON, R1_el.getText());
assertEqual(G1_invON, G1_el.getText());
assertEqual(B1_invON, B1_el.getText());
assertEqual(X1_invON, X1_el.getText());
assertEqual(Y1_invON, Y1_el.getText());

assertEqual(R2_invON, R2_el.getText());
assertEqual(G2_invON, G2_el.getText());
assertEqual(B2_invON, B2_el.getText());
assertEqual(X2_invON, X2_el.getText());
assertEqual(Y2_invON, Y2_el.getText());

assertEqual(R3_invON, R3_el.getText());
assertEqual(G3_invON, G3_el.getText());
assertEqual(B3_invON, B3_el.getText());
assertEqual(X3_invON, X3_el.getText());
assertEqual(Y3_invON, Y3_el.getText());

assertEqual(R4_invON, R4_el.getText());
assertEqual(G4_invON, G4_el.getText());
assertEqual(B4_invON, B4_el.getText());
assertEqual(X4_invON, X4_el.getText());
assertEqual(Y4_invON, Y4_el.getText());

//Move slider to 20, RGBs change
agent.mouseDown(1110,161);
agent.mouseMove([{"x":1347,"y":171,"duration":133}]);
agent.mouseUp(1347,171);
assertEqual("20",multValue.getText());

var R1_invON_desOFF_mult20 = R1_el.getText();
var G1_invON_desOFF_mult20 = G1_el.getText();
var B1_invON_desOFF_mult20 = B1_el.getText();
var X1_invON_desOFF_mult20 = X1_el.getText();
var Y1_invON_desOFF_mult20 = Y1_el.getText();

var R2_invON_desOFF_mult20 = R2_el.getText();
var G2_invON_desOFF_mult20 = G2_el.getText();
var B2_invON_desOFF_mult20 = B2_el.getText();
var X2_invON_desOFF_mult20 = X2_el.getText();
var Y2_invON_desOFF_mult20 = Y2_el.getText();

var R3_invON_desOFF_mult20 = R3_el.getText();
var G3_invON_desOFF_mult20 = G3_el.getText();
var B3_invON_desOFF_mult20 = B3_el.getText();
var X3_invON_desOFF_mult20 = X3_el.getText();
var Y3_invON_desOFF_mult20 = Y3_el.getText();

var R4_invON_desOFF_mult20 = R4_el.getText();
var G4_invON_desOFF_mult20 = G4_el.getText();
var B4_invON_desOFF_mult20 = B4_el.getText();
var X4_invON_desOFF_mult20 = X4_el.getText();
var Y4_invON_desOFF_mult20 = Y4_el.getText();

assertNotEqual(R1, R1_invON_desOFF_mult20);
assertNotEqual(G1, G1_invON_desOFF_mult20);
assertNotEqual(B1, B1_invON_desOFF_mult20);
assertEqual(X1, X1_invON_desOFF_mult20);
assertEqual(Y1, Y1_invON_desOFF_mult20);
assertNotEqual(R2, R2_invON_desOFF_mult20);
assertNotEqual(G2, G2_invON_desOFF_mult20);
assertNotEqual(B2, B2_invON_desOFF_mult20);
assertEqual(X2, X2_invON_desOFF_mult20);
assertEqual(Y2, Y2_invON_desOFF_mult20);
assertNotEqual(R3, R3_invON_desOFF_mult20);
assertNotEqual(G3, G3_invON_desOFF_mult20);
assertNotEqual(B3, B3_invON_desOFF_mult20);
assertEqual(X3, X3_invON_desOFF_mult20);
assertEqual(Y3, Y3_invON_desOFF_mult20);
assertNotEqual(R4, R4_invON_desOFF_mult20);
assertNotEqual(G4, G4_invON_desOFF_mult20);
assertNotEqual(B4, B4_invON_desOFF_mult20);
assertEqual(X4, X4_invON_desOFF_mult20);
assertEqual(Y4, Y4_invON_desOFF_mult20);


assertNotEqual(R1_invON, R1_invON_desOFF_mult20);
assertNotEqual(G1_invON, G1_invON_desOFF_mult20);
assertNotEqual(B1_invON, B1_invON_desOFF_mult20);
assertEqual(X1_invON, X1_invON_desOFF_mult20);
assertEqual(Y1_invON, Y1_invON_desOFF_mult20);
assertNotEqual(R2_invON, R2_invON_desOFF_mult20);
assertNotEqual(G2_invON, G2_invON_desOFF_mult20);
assertNotEqual(B2_invON, B2_invON_desOFF_mult20);
assertEqual(X2_invON, X2_invON_desOFF_mult20);
assertEqual(Y2_invON, Y2_invON_desOFF_mult20);
assertNotEqual(R3_invON, R3_invON_desOFF_mult20);
assertNotEqual(G3_invON, G3_invON_desOFF_mult20);
assertNotEqual(B3_invON, B3_invON_desOFF_mult20);
assertEqual(X3_invON, X3_invON_desOFF_mult20);
assertEqual(Y3_invON, Y3_invON_desOFF_mult20);
assertNotEqual(R4_invON, R4_invON_desOFF_mult20);
assertNotEqual(G4_invON, G4_invON_desOFF_mult20);
assertNotEqual(B4_invON, B4_invON_desOFF_mult20);
assertEqual(X4_invON, X4_invON_desOFF_mult20);
assertEqual(Y4_invON, Y4_invON_desOFF_mult20);

assertNotEqual(R1_invON_desON, R1_invON_desOFF_mult20);
assertNotEqual(G1_invON_desON, G1_invON_desOFF_mult20);
assertNotEqual(B1_invON_desON, B1_invON_desOFF_mult20);
assertEqual(X1_invON_desON, X1_invON_desOFF_mult20);
assertEqual(Y1_invON_desON, Y1_invON_desOFF_mult20);
assertNotEqual(R2_invON_desON, R2_invON_desOFF_mult20);
assertNotEqual(G2_invON_desON, G2_invON_desOFF_mult20);
assertNotEqual(B2_invON_desON, B2_invON_desOFF_mult20);
assertEqual(X2_invON_desON, X2_invON_desOFF_mult20);
assertEqual(Y2_invON_desON, Y2_invON_desOFF_mult20);
assertNotEqual(R3_invON_desON, R3_invON_desOFF_mult20);
assertNotEqual(G3_invON_desON, G3_invON_desOFF_mult20);
assertNotEqual(B3_invON_desON, B3_invON_desOFF_mult20);
assertEqual(X3_invON_desON, X3_invON_desOFF_mult20);
assertEqual(Y3_invON_desON, Y3_invON_desOFF_mult20);
assertNotEqual(R4_invON_desON, R4_invON_desOFF_mult20);
assertNotEqual(G4_invON_desON, G4_invON_desOFF_mult20);
assertNotEqual(B4_invON_desON, B4_invON_desOFF_mult20);
assertEqual(X4_invON_desON, X4_invON_desOFF_mult20);
assertEqual(Y4_invON_desON, Y4_invON_desOFF_mult20);


//Move slider to 1, RGBs change

agent.mouseDown(1305,162);
agent.mouseMove([{"x":1081,"y":157,"duration":167}]);
agent.mouseUp(1081,157);

assertEqual("1",multValue.getText());

assertEqual(R1_invON, R1_el.getText());
assertEqual(G1_invON, G1_el.getText());
assertEqual(B1_invON, B1_el.getText());
assertEqual(X1_invON, X1_el.getText());
assertEqual(Y1_invON, Y1_el.getText());

assertEqual(R2_invON, R2_el.getText());
assertEqual(G2_invON, G2_el.getText());
assertEqual(B2_invON, B2_el.getText());
assertEqual(X2_invON, X2_el.getText());
assertEqual(Y2_invON, Y2_el.getText());

assertEqual(R3_invON, R3_el.getText());
assertEqual(G3_invON, G3_el.getText());
assertEqual(B3_invON, B3_el.getText());
assertEqual(X3_invON, X3_el.getText());
assertEqual(Y3_invON, Y3_el.getText());

assertEqual(R4_invON, R4_el.getText());
assertEqual(G4_invON, G4_el.getText());
assertEqual(B4_invON, B4_el.getText());
assertEqual(X4_invON, X4_el.getText());
assertEqual(Y4_invON, Y4_el.getText());


//Set Invert Colors to OFF
invertToggle.click();

assertEqual(R1, R1_el.getText());
assertEqual(G1, G1_el.getText());
assertEqual(B1, B1_el.getText());
assertEqual(X1, X1_el.getText());
assertEqual(Y1, Y1_el.getText());

assertEqual(R2, R2_el.getText());
assertEqual(G2, G2_el.getText());
assertEqual(B2, B2_el.getText());
assertEqual(X2, X2_el.getText());
assertEqual(Y2, Y2_el.getText());

assertEqual(R3, R3_el.getText());
assertEqual(G3, G3_el.getText());
assertEqual(B3, B3_el.getText());
assertEqual(X3, X3_el.getText());
assertEqual(Y3, Y3_el.getText());

assertEqual(R4, R4_el.getText());
assertEqual(G4, G4_el.getText());
assertEqual(B4, B4_el.getText());
assertEqual(X4, X4_el.getText());
assertEqual(Y4, Y4_el.getText());


//Move slider to 20, RGBs change
agent.mouseDown(1110,161);
agent.mouseMove([{"x":1347,"y":171,"duration":133}]);
agent.mouseUp(1347,171);
assertEqual("20",multValue.getText());

var R1_invOFF_desOFF_mult20 = R1_el.getText();
var G1_invOFF_desOFF_mult20 = G1_el.getText();
var B1_invOFF_desOFF_mult20 = B1_el.getText();
var X1_invOFF_desOFF_mult20 = X1_el.getText();
var Y1_invOFF_desOFF_mult20 = Y1_el.getText();

var R2_invOFF_desOFF_mult20 = R2_el.getText();
var G2_invOFF_desOFF_mult20 = G2_el.getText();
var B2_invOFF_desOFF_mult20 = B2_el.getText();
var X2_invOFF_desOFF_mult20 = X2_el.getText();
var Y2_invOFF_desOFF_mult20 = Y2_el.getText();

var R3_invOFF_desOFF_mult20 = R3_el.getText();
var G3_invOFF_desOFF_mult20 = G3_el.getText();
var B3_invOFF_desOFF_mult20 = B3_el.getText();
var X3_invOFF_desOFF_mult20 = X3_el.getText();
var Y3_invOFF_desOFF_mult20 = Y3_el.getText();

var R4_invOFF_desOFF_mult20 = R4_el.getText();
var G4_invOFF_desOFF_mult20 = G4_el.getText();
var B4_invOFF_desOFF_mult20 = B4_el.getText();
var X4_invOFF_desOFF_mult20 = X4_el.getText();
var Y4_invOFF_desOFF_mult20 = Y4_el.getText();

assertNotEqual(R1, R1_invOFF_desOFF_mult20);
assertNotEqual(G1, G1_invOFF_desOFF_mult20);
assertNotEqual(B1, B1_invOFF_desOFF_mult20);
assertEqual(X1, X1_invOFF_desOFF_mult20);
assertEqual(Y1, Y1_invOFF_desOFF_mult20);
assertNotEqual(R2, R2_invOFF_desOFF_mult20);
assertNotEqual(G2, G2_invOFF_desOFF_mult20);
assertNotEqual(B2, B2_invOFF_desOFF_mult20);
assertEqual(X2, X2_invOFF_desOFF_mult20);
assertEqual(Y2, Y2_invOFF_desOFF_mult20);
assertNotEqual(R3, R3_invOFF_desOFF_mult20);
assertNotEqual(G3, G3_invOFF_desOFF_mult20);
assertNotEqual(B3, B3_invOFF_desOFF_mult20);
assertEqual(X3, X3_invOFF_desOFF_mult20);
assertEqual(Y3, Y3_invOFF_desOFF_mult20);
assertNotEqual(R4, R4_invOFF_desOFF_mult20);
assertNotEqual(G4, G4_invOFF_desOFF_mult20);
assertNotEqual(B4, B4_invOFF_desOFF_mult20);
assertEqual(X4, X4_invOFF_desOFF_mult20);
assertEqual(Y4, Y4_invOFF_desOFF_mult20);

assertNotEqual(R1_invON, R1_invOFF_desOFF_mult20);
assertNotEqual(G1_invON, G1_invOFF_desOFF_mult20);
assertNotEqual(B1_invON, B1_invOFF_desOFF_mult20);
assertEqual(X1_invON, X1_invOFF_desOFF_mult20);
assertEqual(Y1_invON, Y1_invOFF_desOFF_mult20);
assertNotEqual(R2_invON, R2_invOFF_desOFF_mult20);
assertNotEqual(G2_invON, G2_invOFF_desOFF_mult20);
assertNotEqual(B2_invON, B2_invOFF_desOFF_mult20);
assertEqual(X2_invON, X2_invOFF_desOFF_mult20);
assertEqual(Y2_invON, Y2_invOFF_desOFF_mult20);
assertNotEqual(R3_invON, R3_invOFF_desOFF_mult20);
assertNotEqual(G3_invON, G3_invOFF_desOFF_mult20);
assertNotEqual(B3_invON, B3_invOFF_desOFF_mult20);
assertEqual(X3_invON, X3_invOFF_desOFF_mult20);
assertEqual(Y3_invON, Y3_invOFF_desOFF_mult20);
assertNotEqual(R4_invON, R4_invOFF_desOFF_mult20);
assertNotEqual(G4_invON, G4_invOFF_desOFF_mult20);
assertNotEqual(B4_invON, B4_invOFF_desOFF_mult20);
assertEqual(X4_invON, X4_invOFF_desOFF_mult20);
assertEqual(Y4_invON, Y4_invOFF_desOFF_mult20);

assertNotEqual(R1_invON_desON, R1_invOFF_desOFF_mult20);
assertNotEqual(G1_invON_desON, G1_invOFF_desOFF_mult20);
assertNotEqual(B1_invON_desON, B1_invOFF_desOFF_mult20);
assertEqual(X1_invON_desON, X1_invOFF_desOFF_mult20);
assertEqual(Y1_invON_desON, Y1_invOFF_desOFF_mult20);
assertNotEqual(R2_invON_desON, R2_invOFF_desOFF_mult20);
assertNotEqual(G2_invON_desON, G2_invOFF_desOFF_mult20);
assertNotEqual(B2_invON_desON, B2_invOFF_desOFF_mult20);
assertEqual(X2_invON_desON, X2_invOFF_desOFF_mult20);
assertEqual(Y2_invON_desON, Y2_invOFF_desOFF_mult20);
assertNotEqual(R3_invON_desON, R3_invOFF_desOFF_mult20);
assertNotEqual(G3_invON_desON, G3_invOFF_desOFF_mult20);
assertNotEqual(B3_invON_desON, B3_invOFF_desOFF_mult20);
assertEqual(X3_invON_desON, X3_invOFF_desOFF_mult20);
assertEqual(Y3_invON_desON, Y3_invOFF_desOFF_mult20);
assertNotEqual(R4_invON_desON, R4_invOFF_desOFF_mult20);
assertNotEqual(G4_invON_desON, G4_invOFF_desOFF_mult20);
assertNotEqual(B4_invON_desON, B4_invOFF_desOFF_mult20);
assertEqual(X4_invON_desON, X4_invOFF_desOFF_mult20);
assertEqual(Y4_invON_desON, Y4_invOFF_desOFF_mult20);

assertNotEqual(R1_invON_desON_mult20, R1_invOFF_desOFF_mult20);
assertNotEqual(G1_invON_desON_mult20, G1_invOFF_desOFF_mult20);
assertNotEqual(B1_invON_desON_mult20, B1_invOFF_desOFF_mult20);
assertEqual(X1_invON_desON_mult20, X1_invOFF_desOFF_mult20);
assertEqual(Y1_invON_desON_mult20, Y1_invOFF_desOFF_mult20);
assertNotEqual(R2_invON_desON_mult20, R2_invOFF_desOFF_mult20);
assertNotEqual(G2_invON_desON_mult20, G2_invOFF_desOFF_mult20);
assertNotEqual(B2_invON_desON_mult20, B2_invOFF_desOFF_mult20);
assertEqual(X2_invON_desON_mult20, X2_invOFF_desOFF_mult20);
assertEqual(Y2_invON_desON_mult20, Y2_invOFF_desOFF_mult20);
assertNotEqual(R3_invON_desON_mult20, R3_invOFF_desOFF_mult20);
assertNotEqual(G3_invON_desON_mult20, G3_invOFF_desOFF_mult20);
assertNotEqual(B3_invON_desON_mult20, B3_invOFF_desOFF_mult20);
assertEqual(X3_invON_desON_mult20, X3_invOFF_desOFF_mult20);
assertEqual(Y3_invON_desON_mult20, Y3_invOFF_desOFF_mult20);
assertNotEqual(R4_invON_desON_mult20, R4_invOFF_desOFF_mult20);
assertNotEqual(G4_invON_desON_mult20, G4_invOFF_desOFF_mult20);
assertNotEqual(B4_invON_desON_mult20, B4_invOFF_desOFF_mult20);
assertEqual(X4_invON_desON_mult20, X4_invOFF_desOFF_mult20);
assertEqual(Y4_invON_desON_mult20, Y4_invOFF_desOFF_mult20);

assertNotEqual(R1_invON_desOFF_mult20, R1_invOFF_desOFF_mult20);
assertNotEqual(G1_invON_desOFF_mult20, G1_invOFF_desOFF_mult20);
assertNotEqual(B1_invON_desOFF_mult20, B1_invOFF_desOFF_mult20);
assertEqual(X1_invON_desOFF_mult20, X1_invOFF_desOFF_mult20);
assertEqual(Y1_invON_desOFF_mult20, Y1_invOFF_desOFF_mult20);
assertNotEqual(R2_invON_desOFF_mult20, R2_invOFF_desOFF_mult20);
assertNotEqual(G2_invON_desOFF_mult20, G2_invOFF_desOFF_mult20);
assertNotEqual(B2_invON_desOFF_mult20, B2_invOFF_desOFF_mult20);
assertEqual(X2_invON_desOFF_mult20, X2_invOFF_desOFF_mult20);
assertEqual(Y2_invON_desOFF_mult20, Y2_invOFF_desOFF_mult20);
assertNotEqual(R3_invON_desOFF_mult20, R3_invOFF_desOFF_mult20);
assertNotEqual(G3_invON_desOFF_mult20, G3_invOFF_desOFF_mult20);
assertNotEqual(B3_invON_desOFF_mult20, B3_invOFF_desOFF_mult20);
assertEqual(X3_invON_desOFF_mult20, X3_invOFF_desOFF_mult20);
assertEqual(Y3_invON_desOFF_mult20, Y3_invOFF_desOFF_mult20);
assertNotEqual(R4_invON_desOFF_mult20, R4_invOFF_desOFF_mult20);
assertNotEqual(G4_invON_desOFF_mult20, G4_invOFF_desOFF_mult20);
assertNotEqual(B4_invON_desOFF_mult20, B4_invOFF_desOFF_mult20);
assertEqual(X4_invON_desOFF_mult20, X4_invOFF_desOFF_mult20);
assertEqual(Y4_invON_desOFF_mult20, Y4_invOFF_desOFF_mult20);

//Move slider to 1, RGBs change

agent.mouseDown(1305,162);
agent.mouseMove([{"x":1081,"y":157,"duration":167}]);
agent.mouseUp(1081,157);

assertEqual("1",multValue.getText());

assertEqual(R1, R1_el.getText());
assertEqual(G1, G1_el.getText());
assertEqual(B1, B1_el.getText());
assertEqual(X1, X1_el.getText());
assertEqual(Y1, Y1_el.getText());

assertEqual(R2, R2_el.getText());
assertEqual(G2, G2_el.getText());
assertEqual(B2, B2_el.getText());
assertEqual(X2, X2_el.getText());
assertEqual(Y2, Y2_el.getText());

assertEqual(R3, R3_el.getText());
assertEqual(G3, G3_el.getText());
assertEqual(B3, B3_el.getText());
assertEqual(X3, X3_el.getText());
assertEqual(Y3, Y3_el.getText());

assertEqual(R4, R4_el.getText());
assertEqual(G4, G4_el.getText());
assertEqual(B4, B4_el.getText());
assertEqual(X4, X4_el.getText());
assertEqual(Y4, Y4_el.getText());

//Set Desaturate to ON
desaturateToggle.click();

var R1_invOFF_desON = R1_el.getText();
var G1_invOFF_desON = G1_el.getText();
var B1_invOFF_desON = B1_el.getText();
var X1_invOFF_desON = X1_el.getText();
var Y1_invOFF_desON = Y1_el.getText();

var R2_invOFF_desON = R2_el.getText();
var G2_invOFF_desON = G2_el.getText();
var B2_invOFF_desON = B2_el.getText();
var X2_invOFF_desON = X2_el.getText();
var Y2_invOFF_desON = Y2_el.getText();

var R3_invOFF_desON = R3_el.getText();
var G3_invOFF_desON = G3_el.getText();
var B3_invOFF_desON = B3_el.getText();
var X3_invOFF_desON = X3_el.getText();
var Y3_invOFF_desON = Y3_el.getText();

var R4_invOFF_desON = R4_el.getText();
var G4_invOFF_desON = G4_el.getText();
var B4_invOFF_desON = B4_el.getText();
var X4_invOFF_desON = X4_el.getText();
var Y4_invOFF_desON = Y4_el.getText();

assertNotEqual(R1, R1_invOFF_desON);
assertNotEqual(G1, G1_invOFF_desON);
assertNotEqual(B1, B1_invOFF_desON);
assertEqual(X1, X1_invOFF_desON);
assertEqual(Y1, Y1_invOFF_desON);
assertNotEqual(R2, R2_invOFF_desON);
assertNotEqual(G2, G2_invOFF_desON);
assertNotEqual(B2, B2_invOFF_desON);
assertEqual(X2, X2_invOFF_desON);
assertEqual(Y2, Y2_invOFF_desON);
assertNotEqual(R3, R3_invOFF_desON);
assertNotEqual(G3, G3_invOFF_desON);
assertNotEqual(B3, B3_invOFF_desON);
assertEqual(X3, X3_invOFF_desON);
assertEqual(Y3, Y3_invOFF_desON);
assertNotEqual(R4, R4_invOFF_desON);
assertNotEqual(G4, G4_invOFF_desON);
assertNotEqual(B4, B4_invOFF_desON);
assertEqual(X4, X4_invOFF_desON);
assertEqual(Y4, Y4_invOFF_desON);

assertNotEqual(R1_invON, R1_invOFF_desON);
assertNotEqual(G1_invON, G1_invOFF_desON);
assertNotEqual(B1_invON, B1_invOFF_desON);
assertEqual(X1_invON, X1_invOFF_desON);
assertEqual(Y1_invON, Y1_invOFF_desON);
assertNotEqual(R2_invON, R2_invOFF_desON);
assertNotEqual(G2_invON, G2_invOFF_desON);
assertNotEqual(B2_invON, B2_invOFF_desON);
assertEqual(X2_invON, X2_invOFF_desON);
assertEqual(Y2_invON, Y2_invOFF_desON);
assertNotEqual(R3_invON, R3_invOFF_desON);
assertNotEqual(G3_invON, G3_invOFF_desON);
assertNotEqual(B3_invON, B3_invOFF_desON);
assertEqual(X3_invON, X3_invOFF_desON);
assertEqual(Y3_invON, Y3_invOFF_desON);
assertNotEqual(R4_invON, R4_invOFF_desON);
assertNotEqual(G4_invON, G4_invOFF_desON);
assertNotEqual(B4_invON, B4_invOFF_desON);
assertEqual(X4_invON, X4_invOFF_desON);
assertEqual(Y4_invON, Y4_invOFF_desON);

assertNotEqual(R1_invON_desON, R1_invOFF_desON);
assertNotEqual(G1_invON_desON, G1_invOFF_desON);
assertNotEqual(B1_invON_desON, B1_invOFF_desON);
assertEqual(X1_invON_desON, X1_invOFF_desON);
assertEqual(Y1_invON_desON, Y1_invOFF_desON);
assertNotEqual(R2_invON_desON, R2_invOFF_desON);
assertNotEqual(G2_invON_desON, G2_invOFF_desON);
assertNotEqual(B2_invON_desON, B2_invOFF_desON);
assertEqual(X2_invON_desON, X2_invOFF_desON);
assertEqual(Y2_invON_desON, Y2_invOFF_desON);
assertNotEqual(R3_invON_desON, R3_invOFF_desON);
assertNotEqual(G3_invON_desON, G3_invOFF_desON);
assertNotEqual(B3_invON_desON, B3_invOFF_desON);
assertEqual(X3_invON_desON, X3_invOFF_desON);
assertEqual(Y3_invON_desON, Y3_invOFF_desON);
assertNotEqual(R4_invON_desON, R4_invOFF_desON);
assertNotEqual(G4_invON_desON, G4_invOFF_desON);
assertNotEqual(B4_invON_desON, B4_invOFF_desON);
assertEqual(X4_invON_desON, X4_invOFF_desON);
assertEqual(Y4_invON_desON, Y4_invOFF_desON);

assertNotEqual(R1_invON_desON_mult20, R1_invOFF_desON);
assertNotEqual(G1_invON_desON_mult20, G1_invOFF_desON);
assertNotEqual(B1_invON_desON_mult20, B1_invOFF_desON);
assertEqual(X1_invON_desON_mult20, X1_invOFF_desON);
assertEqual(Y1_invON_desON_mult20, Y1_invOFF_desON);
assertNotEqual(R2_invON_desON_mult20, R2_invOFF_desON);
assertNotEqual(G2_invON_desON_mult20, G2_invOFF_desON);
assertNotEqual(B2_invON_desON_mult20, B2_invOFF_desON);
assertEqual(X2_invON_desON_mult20, X2_invOFF_desON);
assertEqual(Y2_invON_desON_mult20, Y2_invOFF_desON);
assertNotEqual(R3_invON_desON_mult20, R3_invOFF_desON);
assertNotEqual(G3_invON_desON_mult20, G3_invOFF_desON);
assertNotEqual(B3_invON_desON_mult20, B3_invOFF_desON);
assertEqual(X3_invON_desON_mult20, X3_invOFF_desON);
assertEqual(Y3_invON_desON_mult20, Y3_invOFF_desON);
assertNotEqual(R4_invON_desON_mult20, R4_invOFF_desON);
assertNotEqual(G4_invON_desON_mult20, G4_invOFF_desON);
assertNotEqual(B4_invON_desON_mult20, B4_invOFF_desON);
assertEqual(X4_invON_desON_mult20, X4_invOFF_desON);
assertEqual(Y4_invON_desON_mult20, Y4_invOFF_desON);

assertNotEqual(R1_invON_desOFF_mult20, R1_invOFF_desON);
assertNotEqual(G1_invON_desOFF_mult20, G1_invOFF_desON);
assertNotEqual(B1_invON_desOFF_mult20, B1_invOFF_desON);
assertEqual(X1_invON_desOFF_mult20, X1_invOFF_desON);
assertEqual(Y1_invON_desOFF_mult20, Y1_invOFF_desON);
assertNotEqual(R2_invON_desOFF_mult20, R2_invOFF_desON);
assertNotEqual(G2_invON_desOFF_mult20, G2_invOFF_desON);
assertNotEqual(B2_invON_desOFF_mult20, B2_invOFF_desON);
assertEqual(X2_invON_desOFF_mult20, X2_invOFF_desON);
assertEqual(Y2_invON_desOFF_mult20, Y2_invOFF_desON);
assertNotEqual(R3_invON_desOFF_mult20, R3_invOFF_desON);
assertNotEqual(G3_invON_desOFF_mult20, G3_invOFF_desON);
assertNotEqual(B3_invON_desOFF_mult20, B3_invOFF_desON);
assertEqual(X3_invON_desOFF_mult20, X3_invOFF_desON);
assertEqual(Y3_invON_desOFF_mult20, Y3_invOFF_desON);
assertNotEqual(R4_invON_desOFF_mult20, R4_invOFF_desON);
assertNotEqual(G4_invON_desOFF_mult20, G4_invOFF_desON);
assertNotEqual(B4_invON_desOFF_mult20, B4_invOFF_desON);
assertEqual(X4_invON_desOFF_mult20, X4_invOFF_desON);
assertEqual(Y4_invON_desOFF_mult20, Y4_invOFF_desON);

assertNotEqual(R1_invOFF_desOFF_mult20, R1_invOFF_desON);
assertNotEqual(G1_invOFF_desOFF_mult20, G1_invOFF_desON);
assertNotEqual(B1_invOFF_desOFF_mult20, B1_invOFF_desON);
assertEqual(X1_invOFF_desOFF_mult20, X1_invOFF_desON);
assertEqual(Y1_invOFF_desOFF_mult20, Y1_invOFF_desON);
assertNotEqual(R2_invOFF_desOFF_mult20, R2_invOFF_desON);
assertNotEqual(G2_invOFF_desOFF_mult20, G2_invOFF_desON);
assertNotEqual(B2_invOFF_desOFF_mult20, B2_invOFF_desON);
assertEqual(X2_invOFF_desOFF_mult20, X2_invOFF_desON);
assertEqual(Y2_invOFF_desOFF_mult20, Y2_invOFF_desON);
assertNotEqual(R3_invOFF_desOFF_mult20, R3_invOFF_desON);
assertNotEqual(G3_invOFF_desOFF_mult20, G3_invOFF_desON);
assertNotEqual(B3_invOFF_desOFF_mult20, B3_invOFF_desON);
assertEqual(X3_invOFF_desOFF_mult20, X3_invOFF_desON);
assertEqual(Y3_invOFF_desOFF_mult20, Y3_invOFF_desON);
assertNotEqual(R4_invOFF_desOFF_mult20, R4_invOFF_desON);
assertNotEqual(G4_invOFF_desOFF_mult20, G4_invOFF_desON);
assertNotEqual(B4_invOFF_desOFF_mult20, B4_invOFF_desON);
assertEqual(X4_invOFF_desOFF_mult20, X4_invOFF_desON);
assertEqual(Y4_invOFF_desOFF_mult20, Y4_invOFF_desON);

//Move slider to 20, RGBs change
agent.mouseDown(1110,161);
agent.mouseMove([{"x":1347,"y":171,"duration":133}]);
agent.mouseUp(1347,171);
assertEqual("20",multValue.getText());

var R1_invOFF_desON_mult20 = R1_el.getText();
var G1_invOFF_desON_mult20 = G1_el.getText();
var B1_invOFF_desON_mult20 = B1_el.getText();
var X1_invOFF_desON_mult20 = X1_el.getText();
var Y1_invOFF_desON_mult20 = Y1_el.getText();

var R2_invOFF_desON_mult20 = R2_el.getText();
var G2_invOFF_desON_mult20 = G2_el.getText();
var B2_invOFF_desON_mult20 = B2_el.getText();
var X2_invOFF_desON_mult20 = X2_el.getText();
var Y2_invOFF_desON_mult20 = Y2_el.getText();

var R3_invOFF_desON_mult20 = R3_el.getText();
var G3_invOFF_desON_mult20 = G3_el.getText();
var B3_invOFF_desON_mult20 = B3_el.getText();
var X3_invOFF_desON_mult20 = X3_el.getText();
var Y3_invOFF_desON_mult20 = Y3_el.getText();

var R4_invOFF_desON_mult20 = R4_el.getText();
var G4_invOFF_desON_mult20 = G4_el.getText();
var B4_invOFF_desON_mult20 = B4_el.getText();
var X4_invOFF_desON_mult20 = X4_el.getText();
var Y4_invOFF_desON_mult20 = Y4_el.getText();

assertNotEqual(R1, R1_invOFF_desON_mult20);
assertNotEqual(G1, G1_invOFF_desON_mult20);
assertNotEqual(B1, B1_invOFF_desON_mult20);
assertEqual(X1, X1_invOFF_desON_mult20);
assertEqual(Y1, Y1_invOFF_desON_mult20);
assertNotEqual(R2, R2_invOFF_desON_mult20);
assertNotEqual(G2, G2_invOFF_desON_mult20);
assertNotEqual(B2, B2_invOFF_desON_mult20);
assertEqual(X2, X2_invOFF_desON_mult20);
assertEqual(Y2, Y2_invOFF_desON_mult20);
assertNotEqual(R3, R3_invOFF_desON_mult20);
assertNotEqual(G3, G3_invOFF_desON_mult20);
assertNotEqual(B3, B3_invOFF_desON_mult20);
assertEqual(X3, X3_invOFF_desON_mult20);
assertEqual(Y3, Y3_invOFF_desON_mult20);
assertNotEqual(R4, R4_invOFF_desON_mult20);
assertNotEqual(G4, G4_invOFF_desON_mult20);
assertNotEqual(B4, B4_invOFF_desON_mult20);
assertEqual(X4, X4_invOFF_desON_mult20);
assertEqual(Y4, Y4_invOFF_desON_mult20);

assertNotEqual(R1_invON, R1_invOFF_desON_mult20);
assertNotEqual(G1_invON, G1_invOFF_desON_mult20);
assertNotEqual(B1_invON, B1_invOFF_desON_mult20);
assertEqual(X1_invON, X1_invOFF_desON_mult20);
assertEqual(Y1_invON, Y1_invOFF_desON_mult20);
assertNotEqual(R2_invON, R2_invOFF_desON_mult20);
assertNotEqual(G2_invON, G2_invOFF_desON_mult20);
assertNotEqual(B2_invON, B2_invOFF_desON_mult20);
assertEqual(X2_invON, X2_invOFF_desON_mult20);
assertEqual(Y2_invON, Y2_invOFF_desON_mult20);
assertNotEqual(R3_invON, R3_invOFF_desON_mult20);
assertNotEqual(G3_invON, G3_invOFF_desON_mult20);
assertNotEqual(B3_invON, B3_invOFF_desON_mult20);
assertEqual(X3_invON, X3_invOFF_desON_mult20);
assertEqual(Y3_invON, Y3_invOFF_desON_mult20);
assertNotEqual(R4_invON, R4_invOFF_desON_mult20);
assertNotEqual(G4_invON, G4_invOFF_desON_mult20);
assertNotEqual(B4_invON, B4_invOFF_desON_mult20);
assertEqual(X4_invON, X4_invOFF_desON_mult20);
assertEqual(Y4_invON, Y4_invOFF_desON_mult20);

assertNotEqual(R1_invON_desON, R1_invOFF_desON_mult20);
assertNotEqual(G1_invON_desON, G1_invOFF_desON_mult20);
assertNotEqual(B1_invON_desON, B1_invOFF_desON_mult20);
assertEqual(X1_invON_desON, X1_invOFF_desON_mult20);
assertEqual(Y1_invON_desON, Y1_invOFF_desON_mult20);
assertNotEqual(R2_invON_desON, R2_invOFF_desON_mult20);
assertNotEqual(G2_invON_desON, G2_invOFF_desON_mult20);
assertNotEqual(B2_invON_desON, B2_invOFF_desON_mult20);
assertEqual(X2_invON_desON, X2_invOFF_desON_mult20);
assertEqual(Y2_invON_desON, Y2_invOFF_desON_mult20);
assertNotEqual(R3_invON_desON, R3_invOFF_desON_mult20);
assertNotEqual(G3_invON_desON, G3_invOFF_desON_mult20);
assertNotEqual(B3_invON_desON, B3_invOFF_desON_mult20);
assertEqual(X3_invON_desON, X3_invOFF_desON_mult20);
assertEqual(Y3_invON_desON, Y3_invOFF_desON_mult20);
assertNotEqual(R4_invON_desON, R4_invOFF_desON_mult20);
assertNotEqual(G4_invON_desON, G4_invOFF_desON_mult20);
assertNotEqual(B4_invON_desON, B4_invOFF_desON_mult20);
assertEqual(X4_invON_desON, X4_invOFF_desON_mult20);
assertEqual(Y4_invON_desON, Y4_invOFF_desON_mult20);

assertNotEqual(R1_invON_desON_mult20, R1_invOFF_desON_mult20);
assertNotEqual(G1_invON_desON_mult20, G1_invOFF_desON_mult20);
assertNotEqual(B1_invON_desON_mult20, B1_invOFF_desON_mult20);
assertEqual(X1_invON_desON_mult20, X1_invOFF_desON_mult20);
assertEqual(Y1_invON_desON_mult20, Y1_invOFF_desON_mult20);
assertNotEqual(R2_invON_desON_mult20, R2_invOFF_desON_mult20);
assertNotEqual(G2_invON_desON_mult20, G2_invOFF_desON_mult20);
assertNotEqual(B2_invON_desON_mult20, B2_invOFF_desON_mult20);
assertEqual(X2_invON_desON_mult20, X2_invOFF_desON_mult20);
assertEqual(Y2_invON_desON_mult20, Y2_invOFF_desON_mult20);
assertNotEqual(R3_invON_desON_mult20, R3_invOFF_desON_mult20);
assertNotEqual(G3_invON_desON_mult20, G3_invOFF_desON_mult20);
assertNotEqual(B3_invON_desON_mult20, B3_invOFF_desON_mult20);
assertEqual(X3_invON_desON_mult20, X3_invOFF_desON_mult20);
assertEqual(Y3_invON_desON_mult20, Y3_invOFF_desON_mult20);
assertNotEqual(R4_invON_desON_mult20, R4_invOFF_desON_mult20);
assertNotEqual(G4_invON_desON_mult20, G4_invOFF_desON_mult20);
assertNotEqual(B4_invON_desON_mult20, B4_invOFF_desON_mult20);
assertEqual(X4_invON_desON_mult20, X4_invOFF_desON_mult20);
assertEqual(Y4_invON_desON_mult20, Y4_invOFF_desON_mult20);

assertNotEqual(R1_invON_desOFF_mult20, R1_invOFF_desON_mult20);
assertNotEqual(G1_invON_desOFF_mult20, G1_invOFF_desON_mult20);
assertNotEqual(B1_invON_desOFF_mult20, B1_invOFF_desON_mult20);
assertEqual(X1_invON_desOFF_mult20, X1_invOFF_desON_mult20);
assertEqual(Y1_invON_desOFF_mult20, Y1_invOFF_desON_mult20);
assertNotEqual(R2_invON_desOFF_mult20, R2_invOFF_desON_mult20);
assertNotEqual(G2_invON_desOFF_mult20, G2_invOFF_desON_mult20);
assertNotEqual(B2_invON_desOFF_mult20, B2_invOFF_desON_mult20);
assertEqual(X2_invON_desOFF_mult20, X2_invOFF_desON_mult20);
assertEqual(Y2_invON_desOFF_mult20, Y2_invOFF_desON_mult20);
assertNotEqual(R3_invON_desOFF_mult20, R3_invOFF_desON_mult20);
assertNotEqual(G3_invON_desOFF_mult20, G3_invOFF_desON_mult20);
assertNotEqual(B3_invON_desOFF_mult20, B3_invOFF_desON_mult20);
assertEqual(X3_invON_desOFF_mult20, X3_invOFF_desON_mult20);
assertEqual(Y3_invON_desOFF_mult20, Y3_invOFF_desON_mult20);
assertNotEqual(R4_invON_desOFF_mult20, R4_invOFF_desON_mult20);
assertNotEqual(G4_invON_desOFF_mult20, G4_invOFF_desON_mult20);
assertNotEqual(B4_invON_desOFF_mult20, B4_invOFF_desON_mult20);
assertEqual(X4_invON_desOFF_mult20, X4_invOFF_desON_mult20);
assertEqual(Y4_invON_desOFF_mult20, Y4_invOFF_desON_mult20);

assertNotEqual(R1_invOFF_desOFF_mult20, R1_invOFF_desON_mult20);
assertNotEqual(G1_invOFF_desOFF_mult20, G1_invOFF_desON_mult20);
assertNotEqual(B1_invOFF_desOFF_mult20, B1_invOFF_desON_mult20);
assertEqual(X1_invOFF_desOFF_mult20, X1_invOFF_desON_mult20);
assertEqual(Y1_invOFF_desOFF_mult20, Y1_invOFF_desON_mult20);
assertNotEqual(R2_invOFF_desOFF_mult20, R2_invOFF_desON_mult20);
assertNotEqual(G2_invOFF_desOFF_mult20, G2_invOFF_desON_mult20);
assertNotEqual(B2_invOFF_desOFF_mult20, B2_invOFF_desON_mult20);
assertEqual(X2_invOFF_desOFF_mult20, X2_invOFF_desON_mult20);
assertEqual(Y2_invOFF_desOFF_mult20, Y2_invOFF_desON_mult20);
assertNotEqual(R3_invOFF_desOFF_mult20, R3_invOFF_desON_mult20);
assertNotEqual(G3_invOFF_desOFF_mult20, G3_invOFF_desON_mult20);
assertNotEqual(B3_invOFF_desOFF_mult20, B3_invOFF_desON_mult20);
assertEqual(X3_invOFF_desOFF_mult20, X3_invOFF_desON_mult20);
assertEqual(Y3_invOFF_desOFF_mult20, Y3_invOFF_desON_mult20);
assertNotEqual(R4_invOFF_desOFF_mult20, R4_invOFF_desON_mult20);
assertNotEqual(G4_invOFF_desOFF_mult20, G4_invOFF_desON_mult20);
assertNotEqual(B4_invOFF_desOFF_mult20, B4_invOFF_desON_mult20);
assertEqual(X4_invOFF_desOFF_mult20, X4_invOFF_desON_mult20);
assertEqual(Y4_invOFF_desOFF_mult20, Y4_invOFF_desON_mult20);

assertNotEqual(R1_invOFF_desON, R1_invOFF_desON_mult20);
assertNotEqual(G1_invOFF_desON, G1_invOFF_desON_mult20);
assertNotEqual(B1_invOFF_desON, B1_invOFF_desON_mult20);
assertEqual(X1_invOFF_desON, X1_invOFF_desON_mult20);
assertEqual(Y1_invOFF_desON, Y1_invOFF_desON_mult20);
assertNotEqual(R2_invOFF_desON, R2_invOFF_desON_mult20);
assertNotEqual(G2_invOFF_desON, G2_invOFF_desON_mult20);
assertNotEqual(B2_invOFF_desON, B2_invOFF_desON_mult20);
assertEqual(X2_invOFF_desON, X2_invOFF_desON_mult20);
assertEqual(Y2_invOFF_desON, Y2_invOFF_desON_mult20);
assertNotEqual(R3_invOFF_desON, R3_invOFF_desON_mult20);
assertNotEqual(G3_invOFF_desON, G3_invOFF_desON_mult20);
assertNotEqual(B3_invOFF_desON, B3_invOFF_desON_mult20);
assertEqual(X3_invOFF_desON, X3_invOFF_desON_mult20);
assertEqual(Y3_invOFF_desON, Y3_invOFF_desON_mult20);
assertNotEqual(R4_invOFF_desON, R4_invOFF_desON_mult20);
assertNotEqual(G4_invOFF_desON, G4_invOFF_desON_mult20);
assertNotEqual(B4_invOFF_desON, B4_invOFF_desON_mult20);
assertEqual(X4_invOFF_desON, X4_invOFF_desON_mult20);
assertEqual(Y4_invOFF_desON, Y4_invOFF_desON_mult20);

//Move slider to 1, RGBs change

agent.mouseDown(1305,162);
agent.mouseMove([{"x":1081,"y":157,"duration":167}]);
agent.mouseUp(1081,157);

assertEqual("1",multValue.getText());

assertEqual(R1_invOFF_desON, R1_el.getText());
assertEqual(G1_invOFF_desON, G1_el.getText());
assertEqual(B1_invOFF_desON, B1_el.getText());
assertEqual(X1_invOFF_desON, X1_el.getText());
assertEqual(Y1_invOFF_desON, Y1_el.getText());

assertEqual(R2_invOFF_desON, R2_el.getText());
assertEqual(G2_invOFF_desON, G2_el.getText());
assertEqual(B2_invOFF_desON, B2_el.getText());
assertEqual(X2_invOFF_desON, X2_el.getText());
assertEqual(Y2_invOFF_desON, Y2_el.getText());

assertEqual(R3_invOFF_desON, R3_el.getText());
assertEqual(G3_invOFF_desON, G3_el.getText());
assertEqual(B3_invOFF_desON, B3_el.getText());
assertEqual(X3_invOFF_desON, X3_el.getText());
assertEqual(Y3_invOFF_desON, Y3_el.getText());

assertEqual(R4_invOFF_desON, R4_el.getText());
assertEqual(G4_invOFF_desON, G4_el.getText());
assertEqual(B4_invOFF_desON, B4_el.getText());
assertEqual(X4_invOFF_desON, X4_el.getText());
assertEqual(Y4_invOFF_desON, Y4_el.getText());

//Set Multiply to OFF
toggle.click();

assertEqual("1",multValue.getText());

assertEqual(R1_invOFF_desON, R1_el.getText());
assertEqual(G1_invOFF_desON, G1_el.getText());
assertEqual(B1_invOFF_desON, B1_el.getText());
assertEqual(X1_invOFF_desON, X1_el.getText());
assertEqual(Y1_invOFF_desON, Y1_el.getText());

assertEqual(R2_invOFF_desON, R2_el.getText());
assertEqual(G2_invOFF_desON, G2_el.getText());
assertEqual(B2_invOFF_desON, B2_el.getText());
assertEqual(X2_invOFF_desON, X2_el.getText());
assertEqual(Y2_invOFF_desON, Y2_el.getText());

assertEqual(R3_invOFF_desON, R3_el.getText());
assertEqual(G3_invOFF_desON, G3_el.getText());
assertEqual(B3_invOFF_desON, B3_el.getText());
assertEqual(X3_invOFF_desON, X3_el.getText());
assertEqual(Y3_invOFF_desON, Y3_el.getText());

assertEqual(R4_invOFF_desON, R4_el.getText());
assertEqual(G4_invOFF_desON, G4_el.getText());
assertEqual(B4_invOFF_desON, B4_el.getText());
assertEqual(X4_invOFF_desON, X4_el.getText());
assertEqual(Y4_invOFF_desON, Y4_el.getText());



//Move slider to 20, RGBs do not change
agent.mouseDown(1110,161);
agent.mouseMove([{"x":1347,"y":171,"duration":133}]);
agent.mouseUp(1347,171);
assertEqual("20",multValue.getText());

assertEqual(R1_invOFF_desON, R1_el.getText());
assertEqual(G1_invOFF_desON, G1_el.getText());
assertEqual(B1_invOFF_desON, B1_el.getText());
assertEqual(X1_invOFF_desON, X1_el.getText());
assertEqual(Y1_invOFF_desON, Y1_el.getText());

assertEqual(R2_invOFF_desON, R2_el.getText());
assertEqual(G2_invOFF_desON, G2_el.getText());
assertEqual(B2_invOFF_desON, B2_el.getText());
assertEqual(X2_invOFF_desON, X2_el.getText());
assertEqual(Y2_invOFF_desON, Y2_el.getText());

assertEqual(R3_invOFF_desON, R3_el.getText());
assertEqual(G3_invOFF_desON, G3_el.getText());
assertEqual(B3_invOFF_desON, B3_el.getText());
assertEqual(X3_invOFF_desON, X3_el.getText());
assertEqual(Y3_invOFF_desON, Y3_el.getText());

assertEqual(R4_invOFF_desON, R4_el.getText());
assertEqual(G4_invOFF_desON, G4_el.getText());
assertEqual(B4_invOFF_desON, B4_el.getText());
assertEqual(X4_invOFF_desON, X4_el.getText());
assertEqual(Y4_invOFF_desON, Y4_el.getText());


//Move slider to 1, RGBs do not change

agent.mouseDown(1305,162);
agent.mouseMove([{"x":1081,"y":157,"duration":167}]);
agent.mouseUp(1081,157);

assertEqual("1",multValue.getText());

assertEqual(R1_invOFF_desON, R1_el.getText());
assertEqual(G1_invOFF_desON, G1_el.getText());
assertEqual(B1_invOFF_desON, B1_el.getText());
assertEqual(X1_invOFF_desON, X1_el.getText());
assertEqual(Y1_invOFF_desON, Y1_el.getText());

assertEqual(R2_invOFF_desON, R2_el.getText());
assertEqual(G2_invOFF_desON, G2_el.getText());
assertEqual(B2_invOFF_desON, B2_el.getText());
assertEqual(X2_invOFF_desON, X2_el.getText());
assertEqual(Y2_invOFF_desON, Y2_el.getText());

assertEqual(R3_invOFF_desON, R3_el.getText());
assertEqual(G3_invOFF_desON, G3_el.getText());
assertEqual(B3_invOFF_desON, B3_el.getText());
assertEqual(X3_invOFF_desON, X3_el.getText());
assertEqual(Y3_invOFF_desON, Y3_el.getText());

assertEqual(R4_invOFF_desON, R4_el.getText());
assertEqual(G4_invOFF_desON, G4_el.getText());
assertEqual(B4_invOFF_desON, B4_el.getText());
assertEqual(X4_invOFF_desON, X4_el.getText());
assertEqual(Y4_invOFF_desON, Y4_el.getText());


//Select different image
agent.element("//*[@data-montage-id='content']/div/div[1]/img").click();
var img2 = agent.element("//*[@data-montage-id='content']/div/div[1]/img").getAttribute("src");
assertEqual (img2, agent.element("//*[@data-montage-id='image']").getAttribute("src"));

assertEqual("ON",desaturateToggle.getText());

//Refresh page. Verify defaults are returned

agent.refresh();
agent.wait(2000);

assertEqual("OFF",agent.element("//*[@data-montage-id='invertToggle']").getText());
assertEqual("OFF",agent.element("//*[@data-montage-id='desaturateToggle']").getText());
assertEqual("OFF",agent.element("//*[@data-montage-id='toggle']").getText());
assertEqual("1",agent.element("/HTML/BODY/DIV/DIV[3]/UL/LI[3]/DIV/DIV[1]/DIV").getText());

assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[2]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[2]/div/div/dl/dd[2]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[2]/div/div/dl/dd[3]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[3]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[1]/div[3]/div/div/dl/dd[2]").getText());

assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[2]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[2]/div/div/dl/dd[2]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[2]/div/div/dl/dd[3]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[3]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[2]/div[3]/div/div/dl/dd[2]").getText());

assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[2]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[2]/div/div/dl/dd[2]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[2]/div/div/dl/dd[3]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[3]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[3]/div[3]/div/div/dl/dd[2]").getText());

assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[2]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[2]/div/div/dl/dd[2]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[2]/div/div/dl/dd[3]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[3]/div/div/dl/dd[1]").getText());
assertEqual("", agent.element("/html/body/div/div[3]/div[1]/div/div[4]/div[3]/div/div/dl/dd[2]").getText());

assertEqual (null, agent.element("//*[@data-montage-id='image']").getAttribute("src"));
