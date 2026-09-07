import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
} from "lucide-react";

import api from "../../api/axios";

import Pagination from "../dashboard/Pagination";

import AddTaskModal from "./AddTaskModal";
import type { Task } from "./AddTaskModal";

import type { Employee } from "../../types/employee";

type Props = {
  projectId: number;
  tasks: Task[];
  employees: Employee[];
  refreshTasks: () => Promise<void>;
  refreshProject: () => Promise<void>;
};

const statusStyles: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Not Started": "bg-orange-100 text-orange-700",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const TaskTable = ({
  projectId,
  tasks,
  employees,
  refreshTasks,
  refreshProject,
}: Props) => {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isManager =
    user.role === "MANAGER" ||
    user.role === "ADMIN";

  const isTeamMember =
    user.role === "TEAM_MEMBER";

  const canCreateTask =
    isManager || isTeamMember;

  const canModifyTask = (task: Task) =>
    isManager ||
    (
      isTeamMember &&
      task.created_by === user.id
    );

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [openModal, setOpenModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const deleteTask = async (taskId: number) => {
    const confirmDelete = window.confirm(
      "Delete this task?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await refreshTasks();
      await refreshProject();
    } catch (error) {
      console.error(error);
      alert("Failed to delete task.");
    }
  };

  const updateTaskStatus = async (
    task: Task,
    newStatus: string
  ) => {
    try {
      const token = localStorage.getItem("token");

      const payload = isTeamMember
        ? {
            status: newStatus,
            remarks: task.remarks,
          }
        : {
            assigned_to: task.assigned_to,
            title: task.title,
            description: task.description,
            status: newStatus,
            priority: task.priority,
            remarks: task.remarks,
            start_date: task.start_date,
            due_date: task.due_date,
          };

      await api.put(
        `/tasks/${task.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await refreshTasks();
      await refreshProject();
    } catch (error) {
      console.error(error);
      alert("Failed to update task status.");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    if (tab === "All") {
      return matchesSearch;
    }

    if (tab === "Open") {
      return (
        task.status !== "Completed" &&
        matchesSearch
      );
    }

    return (
      task.status === "Completed" &&
      matchesSearch
    );
  });

  return (
    <>
      {canCreateTask && (
        <AddTaskModal
          isOpen={openModal}
          onClose={() => {
            setOpenModal(false);
            setEditingTask(null);
          }}
          editingTask={editingTask}
          projectId={projectId}
          employees={employees}
          onSaveTask={async () => {
            await refreshTasks();
            await refreshProject();
          }}
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mt-6 overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-wrap gap-3">

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search task..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-64 pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-3">

            <div className="flex overflow-hidden rounded-lg border border-slate-300">
              {["All", "Open", "Closed"].map(
                (tabOption) => (
                  <button
                    key={tabOption}
                    onClick={() =>
                      setTab(tabOption)
                    }
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      tab === tabOption
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tabOption}
                  </button>
                )
              )}
            </div>

            {canCreateTask && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setOpenModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                <Plus size={16} />
                Add Task
              </button>
            )}

          </div>
        </div>

        <table className="w-full">

          <thead className="bg-slate-50">
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">

              <th className="py-3 text-center w-16 font-semibold">
                Sl.No.
              </th>

              <th className="py-3 text-left font-semibold">
                Title
              </th>

              <th className="py-3 text-left font-semibold">
                Description
              </th>

              <th className="py-3 text-center w-36 font-semibold">
                Status
              </th>

              <th className="py-3 text-center w-32 font-semibold">
                Priority
              </th>

              <th className="py-3 text-center w-40 font-semibold">
                Assigned To
              </th>

              <th className="py-3 text-center w-32 font-semibold">
                Due Date
              </th>

              <th className="py-3 text-center w-24 font-semibold">
                Action
              </th>

            </tr>
          </thead>

          <tbody>

            {filteredTasks.map((task, index) => (
              <tr
                key={task.id}
                className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors"
              >

                <td className="py-3 text-center text-sm text-slate-500">
                  {index + 1}
                </td>

                <td className="py-3 text-sm font-medium text-slate-800">
                  {task.title}
                </td>

                <td className="py-3 text-sm text-slate-600">
                  {task.description}
                </td>

                <td className="py-3 text-center">

                  {isManager ? (
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        statusStyles[task.status] ??
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {task.status}
                    </span>
                  ) : (
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateTaskStatus(
                          task,
                          e.target.value
                        )
                      }
                      className="border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Not Started">
                        Not Started
                      </option>

                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Completed">
                        Completed
                      </option>
                    </select>
                  )}

                </td>

                <td className="py-3 text-center">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      priorityStyles[task.priority] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>

                <td className="py-3 text-center text-sm text-slate-600">
                  {task.assigned_to_name ?? "-"}
                </td>

                <td className="py-3 text-center text-sm text-slate-600">
                  {task.due_date}
                </td>

                <td className="py-3 text-center">

                  {canModifyTask(task) && (
                    <div className="flex justify-center gap-1.5">

                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setOpenModal(true);
                        }}
                        title="Edit task"
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil
                          size={14}
                          strokeWidth={2}
                        />
                      </button>

                      <button
                        onClick={() =>
                          deleteTask(task.id)
                        }
                        title="Delete task"
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <Trash2
                          size={14}
                          strokeWidth={2}
                        />
                      </button>

                    </div>
                  )}

                </td>

              </tr>
            ))}

          </tbody>
        </table>

        {/* Empty State */}

        {filteredTasks.length === 0 && (
          <div className="py-14 flex flex-col items-center justify-center">

            <ClipboardList
              size={40}
              strokeWidth={1.5}
              className="text-slate-300 mb-3"
            />

            <h3 className="text-sm font-semibold text-slate-700">
              No Tasks Found
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Add a new task to get started.
            </p>

          </div>
        )}

        {/* Footer */}

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50">

          <p className="text-xs text-slate-500">
            Showing
            <span className="mx-1 font-semibold text-slate-700">
              {filteredTasks.length}
            </span>
            task(s)
          </p>

          <Pagination
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />

        </div>

      </div>
    </>
  );
};

export default TaskTable;