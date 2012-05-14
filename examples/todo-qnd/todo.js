var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

var Todo = exports.Todo = Montage.create(Component, {
    hasTemplate: {value: false},

    todos: {value: null},

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