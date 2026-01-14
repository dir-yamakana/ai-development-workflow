'use client';

import { useState } from 'react';

type TaskStatus = 'Pending' | 'Running' | 'Completed';

interface SubTask {
  id: string;
  title: string;
  status: TaskStatus;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  subtasks: SubTask[];
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<{ [key: string]: string }>({});

  // タスクの作成
  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        status: 'Pending',
        subtasks: [],
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    }
  };

  // タスクの削除
  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // タスクの編集
  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const saveTaskEdit = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, title: editingTaskTitle } : task
    ));
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const cancelTaskEdit = () => {
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  // タスクのステータス変更
  const changeTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status } : task
    ));
  };

  // サブタスクの追加
  const addSubtask = (taskId: string) => {
    const subtaskTitle = newSubtaskTitle[taskId];
    if (subtaskTitle && subtaskTitle.trim()) {
      const newSubtask: SubTask = {
        id: Date.now().toString(),
        title: subtaskTitle,
        status: 'Pending',
      };
      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: [...task.subtasks, newSubtask] }
          : task
      ));
      setNewSubtaskTitle({ ...newSubtaskTitle, [taskId]: '' });
    }
  };

  // サブタスクの削除
  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, subtasks: task.subtasks.filter(st => st.id !== subtaskId) }
        : task
    ));
  };

  // サブタスクのステータス変更
  const changeSubtaskStatus = (taskId: string, subtaskId: string, status: TaskStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subtaskId ? { ...st, status } : st
            ),
          }
        : task
    ));
  };

  // ステータスの色を取得
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-gray-200 text-gray-800';
      case 'Running':
        return 'bg-blue-200 text-blue-800';
      case 'Completed':
        return 'bg-green-200 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          TODO管理アプリ
        </h1>

        {/* タスク作成フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="新しいタスクを入力..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={addTask}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              追加
            </button>
          </div>
        </div>

        {/* タスク一覧 */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              {/* タスクヘッダー */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {editingTaskId === task.id ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveTaskEdit(task.id)}
                        className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => saveTaskEdit(task.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelTaskEdit}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {task.title}
                    </h3>
                  )}
                  <div className="flex gap-2 items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => changeTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Running">Running</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {editingTaskId !== task.id && (
                    <button
                      onClick={() => startEditingTask(task)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                    >
                      編集
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* サブタスクセクション */}
              <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  サブタスク
                </h4>

                {/* サブタスク追加フォーム */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSubtaskTitle[task.id] || ''}
                    onChange={(e) => setNewSubtaskTitle({ ...newSubtaskTitle, [task.id]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask(task.id)}
                    placeholder="新しいサブタスクを入力..."
                    className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={() => addSubtask(task.id)}
                    className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    追加
                  </button>
                </div>

                {/* サブタスク一覧 */}
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-white mb-1">
                          {subtask.title}
                        </p>
                        <div className="flex gap-2 items-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subtask.status)}`}>
                            {subtask.status}
                          </span>
                          <select
                            value={subtask.status}
                            onChange={(e) => changeSubtaskStatus(task.id, subtask.id, e.target.value as TaskStatus)}
                            className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Running">Running</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSubtask(task.id, subtask.id)}
                        className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                  {task.subtasks.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      サブタスクはありません
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                タスクがありません。新しいタスクを追加してください。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
