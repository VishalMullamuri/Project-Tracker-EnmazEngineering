import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
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

  const [search, setSearch] =
    useState("");

  const [tab, setTab] =
    useState("All");

  const [openModal, setOpenModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const deleteTask = async (
    taskId: number
  ) => {

    const confirmDelete =
      window.confirm(
        "Delete this task?"
      );

    if (!confirmDelete) return;

    try {

      const token =
        localStorage.getItem("token");

      await api.delete(
        `/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await refreshTasks();

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

    const token =
      localStorage.getItem("token");

    const role = JSON.parse(localStorage.getItem("user") || "{}").role;

const payload =
  role === "TEAM_MEMBER"
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

setTimeout(async () => {
  await refreshProject();
}, 200);

  } catch (error) {

    console.error(error);

    alert("Failed to update task status.");

  }

};



  const filteredTasks =
    tasks.filter((task) => {

      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      if (tab === "All")
        return matchesSearch;

      if (tab === "Open")
        return (
          task.status !==
            "Completed" &&
          matchesSearch
        );

      return (
        task.status ===
          "Completed" &&
        matchesSearch

      );
    });

  return (
    <>

{isManager && (

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search task..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                w-64
                pl-9
                pr-3
                py-2
                text-sm
                border
                border-gray-300
                rounded-lg
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

          </div>

          <div className="flex items-center gap-3">

            <div className="flex overflow-hidden rounded-lg border border-gray-300">

              <button
                onClick={() =>
                  setTab("All")
                }
                className={`px-4 py-2 text-sm font-medium transition ${
                  tab === "All"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </button>

              <button
                onClick={() =>
                  setTab("Open")
                }
                className={`px-4 py-2 text-sm font-medium transition ${
                  tab === "Open"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Open
              </button>

              <button
                onClick={() =>
                  setTab("Closed")
                }
                className={`px-4 py-2 text-sm font-medium transition ${
                  tab === "Closed"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Closed
              </button>

            </div>

           {isManager && (

<button
  onClick={() => {
    setEditingTask(null);
    setOpenModal(true);
  }}
  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
>
  <Plus size={16} />
  Add Task
</button>

)}

          </div>

        </div>

        <table className="w-full">
                    <thead className="bg-gray-50">

            <tr className="text-sm text-gray-600">

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

              <th className="py-3 text-center w-36 font-semibold">
                Due Date
              </th>

              <th className="py-3 text-center w-40 font-semibold">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredTasks.map((task, index) => (

              <tr
                key={task.id}
                className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200"
              >

                <td className="py-3 text-center text-sm font-medium">
                  {index + 1}
                </td>

                <td className="py-3 text-sm font-medium">
                  {task.title}
                </td>

                <td className="py-3 text-sm">
                  {task.description}
                </td>

<td className="py-3 text-center">

  {isManager ? (

    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
        task.status === "Completed"
          ? "bg-green-100 text-green-700"
          : task.status === "In Progress"
          ? "bg-blue-100 text-blue-700"
          : "bg-orange-100 text-orange-700"
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
      className="border rounded-lg px-2 py-1 text-sm"
    >
      <option value="Pending">
        Pending
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
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      task.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : task.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {task.priority}
                  </span>

                </td>

                <td className="py-3 text-center text-sm">

  {task.assigned_to_name ?? "-"}

</td>

                <td className="py-3 text-center text-sm">
                  {task.due_date}
                </td>

                <td className="py-3 text-center">

                  <div className="flex justify-center gap-2">

{isManager && (

<>
  <button
    onClick={() => {
      setEditingTask(task);
      setOpenModal(true);
    }}
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition"
  >
    <Pencil size={15} />
    Edit
  </button>

  <button
    onClick={() =>
      deleteTask(task.id)
    }
    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
  >
    <Trash2 size={16} />
  </button>
</>

)}

</div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>
                {/* Empty State */}

        {filteredTasks.length === 0 && (

          <div className="py-12 flex flex-col items-center justify-center">

            <div className="text-5xl mb-3">
              📋
            </div>

            <h3 className="text-lg font-semibold text-gray-700">
              No Tasks Found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add a new task to get started.
            </p>

          </div>

        )}

        {/* Footer */}

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">

          <p className="text-sm text-gray-500">

            Showing

            <span className="mx-1 font-semibold text-gray-700">
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