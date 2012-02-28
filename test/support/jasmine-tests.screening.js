var agent = new Agent();

agent.gotoUrl("http://localhost:8081/montage/test/run.html");

var previousUpdate = 0;

while(true) {
  var lastUpdate = agent.executeScript("return jasmine.getEnv().lastUpdate");

  if (lastUpdate === previousUpdate) {
    break;
  } else {
    previousUpdate = lastUpdate;
  }

  agent.wait(5000);
}

var desc = agent.element("//*[@class='description']").getInnerText();

var testsDone = /([0-9]+)\//.exec(desc)[1];
var testsTotal = /\/([0-9]+)/.exec(desc)[1];
var failures = /([0-9]+) failure/.exec(desc)[1]

assertEqual(testsTotal, testsDone, "all tests ran");
assertEqual("0", failures, "no failures");

var fails = agent.elements("//*[@class='spec failed']");
for (var i = 0, len = fails.length; i < len; i++) {
  // HACK to show all the failed tests
  assertTrue(false, fails[i].getInnerText());
}
