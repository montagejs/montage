/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var Todo = exports.Todo = Montage.create(Component, {
    hasTemplate: {value: false},

    todos: {
        value: null
    },

    todoItem: {
        value: null
    },

    todoList: {
        value: null
    },


    templateDidLoad: {value: function() {
        var self = this,
            todos;

        this.load();
        todos = this.todos;
        this.todoCount = document.getElementById("todo-count");
        this.todoClear = document.getElementById("todo-clear");
        this.newTodo = document.getElementById("new-todo");

        Object.defineBinding(this.todoItem, "data", {
            boundObject: this.todoList,
            boundObjectPropertyPath: "objectAtCurrentIteration",
            oneway: true
        });

        this.newTodo.addEventListener("keypress", function(event) {
            if (event.keyCode == 13 && this.value) {
                self.todos.push({text: this.value, done: false});
                self.save();
                self.clearInput = true;
                self.needsDraw = true;
            }
        });

        todos.addPropertyChangeListener("done", function() {
            self.needsDraw = true;
        });

        this.todoClear.querySelector("a").addEventListener("click", function() {
            self.removeDone();
        });

        this.needsDraw = true;
    }},

    draw: {value: function() {
        var todos = this.todos,
            length = todos.length,
            count = todos.filter(function(data) { return !data.done}).length,
            countDone = length-count;

        this.updateCount(this.todoCount, length == 0, count);
        this.updateCount(this.todoClear, countDone == 0, countDone);
        if (this.clearInput) {
            this.clearInput = false;
            this.newTodo.value = "";
        }
    }},

    updateCount: {value: function(element, hide, count) {
        if (hide) {
            element.style.display = "none";
        } else {
            element.querySelector(".number").textContent = count;
            element.querySelector(".word").textContent = (count == 1 ? "item" : "items");
            element.style.display = "block";
        }
    }},

    load: {value: function() {
        this.todos = JSON.parse(localStorage.getItem("todos")) || [];
    }},

    save: {value: function() {
        localStorage.setItem("todos", JSON.stringify(this.todos));
    }},

    removeItem: {value: function(data) {
        var ix = this.todos.indexOf(data);
        this.todos.splice(ix, 1);
        this.save();
    }},

    removeDone: {value: function() {
        this.todos = this.todos.filter(function(todo) { return !todo.done });
        this.save();
        this.needsDraw = true;
    }}
});

var TodoItem = exports.TodoItem = Montage.create(Component, {
    hasTemplate: {value: false},

    prepareForDraw: {value: function() {
        var self = this,
            element = this.element,
            checkbox = element.querySelector("input[type='checkbox']"),
            destroy = element.querySelector(".todo-destroy");

        this.checkbox = checkbox;
        this.text = element.querySelector(".todo-text");

        checkbox.addEventListener("change", function() {
            self.data.done = this.checked;
            self.needsDraw = true;
        });

        destroy.addEventListener("click", function() {
            Todo.removeItem(self.data);
        });
    }},

    draw: {value: function() {
        var data = this.data;

        if (data) {
            this.text.textContent = data.text;
            if (data.done) {
                this.element.classList.add("done");
                this.checkbox.checked = true;
            } else {
                this.element.classList.remove("done");
                this.checkbox.checked = false;
            }
        }
    }},

    data: {
        modify: function() { this.needsDraw = true },
        get: function() { return this._data },
        set: function(value) {
            this._data = value;
            this.needsDraw = true;
        }
    }
});
