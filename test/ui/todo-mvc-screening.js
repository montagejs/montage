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

var agent = new Agent();
agent.gotoUrl(config.montage_url+"/examples/todo-mvc/index.html");

// Set script properties

agent.wait(3000);

script.setOption("exitOnFailure", false);
script.setOption("timeout", 1000);
script.setOption("sync.mode", "auto");



//Verify initial state of the app - no items in the list
agent.setWindowSize(927, 989);

var input = agent.element("//*[@data-montage-id='taskForm']/DIV/LABEL/INPUT");
var itemText = agent.element("/HTML/BODY/DIV/DIV");


assertEqual("0 items left", itemText.getText());

//Add 3 tasks, verify they appear in the list, "Clear Completed" button appears,
//and total count == 3

input.sendKeys("Task1")
    .sendKeys(Key.ENTER);

var btn_Complete = agent.element("//*[@data-montage-id='markAllCompleteButton']");
var firstCheckBox = agent.element("//*[@data-montage-id='completedCheckbox']");
var firstItem = agent.element("/HTML/BODY/DIV/UL/LI/DIV/FORM/DIV/LABEL/SPAN[2]");

assertEqual("Mark all as complete", btn_Complete.getText());
assertTrue (agent.doesElementExist("//*[@data-montage-id='completedCheckbox']"));
assertEqual("Task1", firstItem.getText());
assertEqual("1 item left", itemText.getText());

input.sendKeys("Task2")
    .sendKeys(Key.ENTER);

var secondCheckBox = agent.element("/HTML/BODY/DIV/UL/LI[2]/DIV/FORM/DIV/LABEL/INPUT");
var secondItem = agent.element("/HTML/BODY/DIV/UL/LI[2]/DIV/FORM/DIV/LABEL/SPAN[2]");

input.sendKeys("Task3")
    .sendKeys(Key.ENTER);

assertEqual("3 items left", itemText.getText());


//Mark 2nd Task as completed, verify the task has strike-through, and total count of tasks == 2
secondCheckBox.click();

var btn_Clear = agent.element("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT");

assertTrue (agent.doesElementExist("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT"));
assertEqual("Clear Completed", btn_Clear.getText());

assertEqual("Task2", secondItem.getText());
assertEqual("line-through", secondItem.getComputedStyle("text-decoration"));

assertEqual("2 items left", itemText.getText());

//Clear completed task (Task2), verify it's removed from the list
btn_Clear.click();

assertEqual("Task3", secondItem.getText());
assertFalse (agent.doesElementExist("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT"));

//Mark all tasks as "Completed"
//Verify  all check-boxes have check-marks, all tasks are crossed, and tasks count ==0
btn_Complete.click();

assertEqual ("Mark all as incomplete",btn_Complete.getText());
assertTrue(firstCheckBox.getAttribute("aria-checked"));
assertTrue(secondCheckBox.getAttribute("aria-checked"));

assertEqual("Task1", firstItem.getText());
assertEqual("line-through", firstItem.getComputedStyle("text-decoration"));
assertEqual("Task3", secondItem.getText());
assertEqual("line-through", secondItem.getComputedStyle("text-decoration"));

assertEqual("0 items left", itemText.getText());
assertTrue (agent.doesElementExist("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT"));

//Uncheck check-box next to Task3
//Verify only Task1 is marked as "Completed"
secondCheckBox.click();
assertEqual("Task1", firstItem.getText());
assertEqual("line-through", firstItem.getComputedStyle("text-decoration"));
assertEqual("Task3", secondItem.getText());
assertEqual("none", secondItem.getComputedStyle("text-decoration"));

assertEqual ("Mark all as complete",btn_Complete.getText());
assertEqual("1 item left", itemText.getText());

//Refresh the page. Verify items on the page persist
agent.refresh();

firstItem = agent.element("/HTML/BODY/DIV/UL/LI/DIV/FORM/DIV/LABEL/SPAN[2]");
btn_Complete = agent.element("//*[@data-montage-id='markAllCompleteButton']");
firstCheckBox = agent.element("//*[@data-montage-id='completedCheckbox']");
secondCheckBox = agent.element("/HTML/BODY/DIV/UL/LI[2]/DIV/FORM/DIV/LABEL/INPUT");
secondItem = agent.element("/HTML/BODY/DIV/UL/LI[2]/DIV/FORM/DIV/LABEL/SPAN[2]");
btn_Clear = agent.element("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT");
input = agent.element("//*[@data-montage-id='taskForm']/DIV/LABEL/INPUT");
itemText = agent.element("/HTML/BODY/DIV/DIV");

assertEqual("Task1", firstItem.getText());
assertEqual("line-through", firstItem.getComputedStyle("text-decoration"));
assertEqual("Task3", secondItem.getText());
assertEqual("none", secondItem.getComputedStyle("text-decoration"));

//Mark all tasks as "Complete"
btn_Complete.click();

assertEqual ("Mark all as incomplete",btn_Complete.getText());
assertTrue(firstCheckBox.getAttribute("aria-checked"));
assertTrue(secondCheckBox.getAttribute("aria-checked"));

assertEqual("Task1", firstItem.getText());
assertEqual("line-through", firstItem.getComputedStyle("text-decoration"));
assertEqual("Task3", secondItem.getText());
assertEqual("line-through", secondItem.getComputedStyle("text-decoration"));

assertEqual("0 items left", itemText.getText());
assertTrue (agent.doesElementExist("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT"));

//Mark all tasks as "Incomplete"
btn_Complete.click();
agent.wait(1000);
assertEqual("false",firstCheckBox.getAttribute("aria-checked"));
assertEqual("false",secondCheckBox.getAttribute("aria-checked"));
assertEqual("Task1", firstItem.getText());
assertEqual("none", firstItem.getComputedStyle("text-decoration"));
assertEqual("Task3", secondItem.getText());
assertEqual("none", secondItem.getComputedStyle("text-decoration"));
assertEqual("2 items left", itemText.getText());
assertFalse(agent.doesElementExist("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT"));


//Mark all tasks as "Complete" and clear the list
btn_Complete.click();

assertEqual ("Mark all as incomplete",btn_Complete.getText());
assertEqual("true", firstCheckBox.getAttribute("aria-checked"));
assertEqual("true", secondCheckBox.getAttribute("aria-checked"));

assertEqual("Task1", firstItem.getText());
assertEqual("line-through", firstItem.getComputedStyle("text-decoration"));
assertEqual("Task3", secondItem.getText());
assertEqual("line-through", secondItem.getComputedStyle("text-decoration"));

assertEqual("0 items left", itemText.getText());
assertTrue (agent.doesElementExist("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT"));


btn_Clear.click();
assertEqual("0 items left", itemText.getText());
assertFalse (agent.doesElementExist("/HTML/BODY/DIV/UL/LI/DIV/FORM/DIV/LABEL/SPAN[2]"));
assertFalse (agent.doesElementExist("/HTML/BODY/DIV/UL/LI[2]/DIV/FORM/DIV/LABEL/SPAN[2]"));

assertFalse (agent.doesElementExist("//*[@data-montage-id='completedCheckbox']"));
assertFalse (agent.doesElementExist("/HTML/BODY/DIV/UL/LI[2]/DIV/FORM/DIV/LABEL/INPUT"));

assertFalse (agent.doesElementExist("//*[@data-montage-id='markAllCompleteButton']"));
assertFalse (agent.doesElementExist("//*[@data-montage-id='clearCompletedForm']/DIV/INPUT"));

assertEqual("0 items left", itemText.getText());

//Add 20 tasks so the list is scrollable
for (var i=0; i<20; i++) {
  input.sendKeys("Task"+i)
    .sendKeys(Key.ENTER);

 }

btn_Complete.click();

agent.setScroll(0,300);
assertEqual([0,300], agent.getScroll());

btn_Clear.click();

assertEqual("0 items left", itemText.getText());

//Verify input box is cleared once the task is added to the list
input.sendKeys("Task1")
    .sendKeys(Key.ENTER);

assertEqual("",input.getText());
