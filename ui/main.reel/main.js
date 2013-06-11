var Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController,
    Todo = require("core/todo").Todo,
    Serializer = require("montage/core/serialization").Serializer,
    Deserializer = require("montage/core/serialization").Deserializer,
    LOCAL_STORAGE_KEY = "todos-montage";

exports.Main = Component.specialize({

    newTodoForm: {
        value: null
    },

    newTodoInput: {
        value: null
    },

    todoListController: {
        value: null
    },

    didCreate: {
        value: function() {
            this.todoListController = new RangeController();
            this.addPathChangeListener("todos.every{completed}", this, "handleTodosCompletedChanged");

            this.defineBindings({
                "todos": {"<-": "todoListController.organizedContent"},
                "todosLeft": {"<-": "todos.filter{!completed}"},
                "todosCompleted": {"<-": "todos.filter{completed}"}
            });
        }
    },

    templateDidLoad: {
        value: function() {
            this.load();
        }
    },

    load: {
        value: function() {
            if (localStorage) {
                var todoSerialization = localStorage.getItem(LOCAL_STORAGE_KEY);

                if (todoSerialization) {
                    var deserializer = new Deserializer(),
                        self = this;

                    deserializer.init(todoSerialization, require)
                    .deserializeObject()
                    .then(function(todos) {
                        self.todoListController.initWithContent(todos);
                    }).fail(function() {
                        console.error("Could not load saved tasks.");
                        console.debug("Could not deserialize", todoSerialization);
                        console.log(e.stack);
                    });
                }
            }
        }
    },

    save: {
        value: function() {
            if (localStorage) {
                var todos = this.todoListController.content,
                    serializer = new Serializer().initWithRequire(require);

                localStorage.setItem(LOCAL_STORAGE_KEY, serializer.serializeObject(todos));
            }
        }
    },

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this.newTodoForm.identifier = "newTodoForm";
                this.newTodoForm.addEventListener("submit", this, false);

                this.addEventListener("destroyTodo", this, true);

                window.addEventListener("beforeunload", this, true);
            }
        }
    },

    captureDestroyTodo: {
        value: function(evt) {
            this.destroyTodo(evt.detail.todo);
        }
    },

    createTodo: {
        value: function(title) {
            var todo = new Todo().initWithTitle(title);
            this.todoListController.add(todo);
            return todo;
        }
    },

    destroyTodo: {
        value: function(todo) {
            this.todoListController.delete(todo);
            return todo;
        }
    },

    _allCompleted: {
        value: null
    },

    allCompleted: {
        get: function() {
            return this._allCompleted;
        },
        set: function(value) {
            this._allCompleted = value;
            this.todoListController.organizedContent.forEach(function(member) {
                member.completed = value;
            });
        }
    },

    todos: {
        value: null
    },

    todosLeft: {
        value: null
    },

    todosCompleted: {
        value: null
    },

    // Handlers

    handleNewTodoFormSubmit: {
        value: function(evt) {
            evt.preventDefault();

            var title = this.newTodoInput.value.trim();

            if ("" === title) {
                return;
            }

            this.createTodo(title);
            this.newTodoInput.value = null;
        }
    },

    handleTodosCompletedChanged: {
        value: function(value) {
            this._allCompleted = value;
            this.dispatchOwnPropertyChange("allCompleted", value);
        }
    },

    handleClearCompletedButtonAction: {
        value: function(evt) {
            var completedTodos = this.todoListController.organizedContent.filter(function(todo) {
                return todo.completed;
            });

            if (completedTodos.length > 0) {
                this.todoListController.deleteEach(completedTodos);
            }
        }
    },

    captureBeforeunload: {
        value: function() {
            this.save();
        }
    }
});