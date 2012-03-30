var config = script.require('config.js').config();
// ==== Start Recorded Script, Tue Mar 06 2012 13:39:29 GMT-0800 (PST)====

var agent = new Agent();

agent.gotoUrl(config.montage_url+"/examples/uuid-generator/");

agent.setWindowSize(927, 974);

//Gererate 4 UUIDs, verify all are unique
agent.element("//*[@id='generateUuid']").click(Mouse.LEFT,76,29);
agent.wait(1608);
agent.element("//*[@id='generateUuid']").click(Mouse.LEFT,76,28);
agent.wait(1728);
agent.element("//*[@id='generateUuid']").click(Mouse.LEFT,76,28);
agent.wait(1448);
agent.element("//*[@id='generateUuid']").click(Mouse.LEFT,76,28);


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

