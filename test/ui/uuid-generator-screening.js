/*global script,Agent,Key,Mouse,assertEqual */
var config = script.require('config.js').config();

var agent = new Agent();
agent.gotoUrl(config.montage_url+"/examples/uuid-generator/");

var generate_uuid = agent.element("//*[@id='generate-uuid']");

// Click "Generate UUID"
generate_uuid.click(Mouse.LEFT,48,10);
// A new UUID is generated
agent.waitForElement("/HTML/BODY/UL/LI[1]");
assertTrue(agent.doesElementExist("/HTML/BODY/UL/LI[1]/INPUT"));

// Create 4 new UUID
generate_uuid.click(Mouse.LEFT,50,9);
generate_uuid.click(Mouse.LEFT,50,9);
generate_uuid.click(Mouse.LEFT,50,9);
generate_uuid.click(Mouse.LEFT,50,9);

// Just wait for the last element, then all will exist
agent.waitForElement("/HTML/BODY/UL/LI[5]");
assertTrue(agent.doesElementExist("/HTML/BODY/UL/LI[2]/INPUT"));
assertTrue(agent.doesElementExist("/HTML/BODY/UL/LI[3]/INPUT"));
assertTrue(agent.doesElementExist("/HTML/BODY/UL/LI[4]/INPUT"));
assertTrue(agent.doesElementExist("/HTML/BODY/UL/LI[5]/INPUT"));

var a = agent.element("/HTML/BODY/UL/LI[2]/INPUT").getAttribute("value");
var b = agent.element("/HTML/BODY/UL/LI[3]/INPUT").getAttribute("value");
var c = agent.element("/HTML/BODY/UL/LI[4]/INPUT").getAttribute("value");
var d = agent.element("/HTML/BODY/UL/LI[5]/INPUT").getAttribute("value");

// All UUIDs are different
assertNotEqual(a, b);
assertNotEqual(a, c);
assertNotEqual(a, d);
assertNotEqual(b, c);
assertNotEqual(b, d);
assertNotEqual(c, d);


// ==== End Recorded Script ====