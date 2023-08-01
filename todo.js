var TodoApp = angular.module('TodoApp', ['ngStorage']);

TodoApp.controller('TodoCtrl', function ($scope, $localStorage) {
    var currentEdited = false,
        currentEditedIndex = null;
    $scope.priority = '2';
    $scope.dueDate = new Date();
    $scope.showHistory = false;
    $scope.history = $localStorage.history || [];

    if ($localStorage.todos) {
        angular.forEach($localStorage.todos, function (value, key) {
            value.dueDate = new Date(value.dueDate);
        });
        $scope.todos = $localStorage.todos;
        $scope.predicate = $localStorage.predicate;
        $scope.reverse = $localStorage.reverse;
    } else {
        $scope.todos = [
            // Add your default tasks here
        ];
        $scope.predicate = 'summary';
        $scope.reverse = true;
    }

    $scope.order = function (predicate) {
        $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
        $scope.predicate = predicate;
        $scope.saveToLocalStorage();
    };

    $scope.addTodo = function () {
        if (!$scope.todoSummary || $scope.todoSummary.trim() === '') return;

        $scope.todos.push({
            summary: $scope.todoSummary,
            description: $scope.todoDescription,
            priority: $scope.priority,
            dueDate: $scope.dueDate,
            status: 'todo',
            done: false
        });

        $scope.todoSummary = '';
        $scope.todoDescription = '';
        $scope.priority = '2';
        $scope.dueDate = new Date();

        $scope.saveToLocalStorage();
    };

    $scope.remaining = function () {
        var count = 0;
        angular.forEach($scope.todos, function (todo) {
            count += todo.done ? 0 : 1;
        });
        return count;
    };

    $scope.archive = function () {
        $scope.endEditMode();
        var oldTodos = $scope.todos;
        $scope.todos = [];
        angular.forEach(oldTodos, function (todo) {
            if (!todo.done) $scope.todos.push(todo);
        });
        $scope.saveToLocalStorage();
    };

    $scope.edit = function ($event) {
        if ($scope.todos[$scope.todos.indexOf(this.todo)].done) return;
        $scope.endEditMode();
        currentEditedIndex = $scope.todos.indexOf(this.todo);
        currentEdited = $event.currentTarget.parentElement;
        currentEdited.classList.add('editItem');
    };

    $scope.editSubmit = function ($event) {
        var currentEditedIndex = $scope.todos.indexOf(this.todo);
        $scope.todos[currentEditedIndex].summary = $event.currentTarget.querySelector('input').value;
        $scope.endEditMode();
        $scope.saveToLocalStorage();
    };

    $scope.editDescription = function ($event) {
        $scope.endEditMode();
        var currentEditedIndex = $scope.todos.indexOf(this.todo);
        var currentEdited = $event.currentTarget.parentElement;
        currentEdited.classList.add('editItem');
    };

    $scope.editDescriptionSubmit = function ($event) {
        var currentEditedIndex = $scope.todos.indexOf(this.todo);
        $scope.todos[currentEditedIndex].description = $event.currentTarget.querySelector('input').value;
        $scope.endEditMode();
        $scope.saveToLocalStorage();
    };

    $scope.changeStatus = function (task) {
        task.done = !task.done;
        $scope.saveToLocalStorage();
    };

    $scope.removeTask = function (task) {
        $scope.endEditMode();
        $scope.history.push({
            type: 'delete',
            task: task
        });
        $scope.todos.splice($scope.todos.indexOf(task), 1);
        $scope.saveToLocalStorage();
    };

    $scope.saveToLocalStorage = function () {
        $localStorage.todos = $scope.todos;
        $localStorage.predicate = $scope.predicate;
        $localStorage.reverse = $scope.reverse;
        $localStorage.history = $scope.history;
    };

    $scope.endEditMode = function () {
        if (currentEdited) {
            currentEdited.querySelector('.editForm input').value = $scope.todos[currentEditedIndex].summary;
            currentEdited.querySelector('.editForm textarea').value = $scope.todos[currentEditedIndex].description;
            currentEdited.classList.remove('editItem');
            currentEdited = false;
        }
    };

    $scope.exportToCSV = function () {
        var csvContent = "data:text/csv;charset=utf-8,";

        var header = ['Summary', 'Description', 'Priority', 'Due Date', 'Status', 'Done'];
        csvContent += header.join(",") + "\n";

        $scope.todos.forEach(function (todo) {
            var row = [
                '"' + todo.summary + '"',
                '"' + (todo.description || '') + '"',
                getPriorityLabel(todo.priority),
                formatDate(todo.dueDate),
                todo.status,
                todo.done
            ];
            csvContent += row.join(",") + "\n";
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "todos.csv");
        document.body.appendChild(link);
        link.click();
    };

    $scope.getHistoryLogs = function () {
        var logs = [];
        angular.forEach($scope.history, function (log) {
            var logString;
            if (log.type === 'delete') {
                logString = "Task: '" + log.task.summary + "' - Description: '" + log.task.description +
                    "' - Status: 'Deleted' - Priority: '" + getPriorityLabel(log.task.priority) +
                    "' - Due Date: '" + formatDate(log.task.dueDate) + "' - Done: " + log.task.done;
            } else if (log.type === 'edit') {
                logString = "Task: '" + log.taskBeforeEdit.summary + "' - Description Before Edit: '" + log.taskBeforeEdit.description +
                    "' - Status Before Edit: '" + log.taskBeforeEdit.status + "' - Priority Before Edit: '" + getPriorityLabel(log.taskBeforeEdit.priority) +
                    "' - Due Date Before Edit: '" + formatDate(log.taskBeforeEdit.dueDate) + "' - Done Before Edit: " + log.taskBeforeEdit.done +
                    "' - Description After Edit: '" + log.taskAfterEdit.description +
                    "' - Status After Edit: '" + log.taskAfterEdit.status + "' - Priority After Edit: '" + getPriorityLabel(log.taskAfterEdit.priority) +
                    "' - Due Date After Edit: '" + formatDate(log.taskAfterEdit.dueDate) + "' - Done After Edit: " + log.taskAfterEdit.done;
            }
            logs.push(logString);
        });
        return logs;
    };

    $scope.toggleHistory = function () {
        $scope.showHistory = !$scope.showHistory;
    };

    $scope.clearHistory = function () {
        $scope.history = [];
        $localStorage.history = [];
    };

    function formatDate(date) {
        return new Date(date).toLocaleString();
    }

    function getPriorityLabel(priority) {
        switch (priority) {
            case '3':
                return 'High';
            case '2':
                return 'Medium';
            case '1':
                return 'Low';
            default:
                return 'Unknown';
        }
    }
});
