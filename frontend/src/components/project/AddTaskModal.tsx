import { useEffect, useState } from "react";
import api from "../../api/axios";
import axios from "axios";
import type { Employee } from "../../types/employee";

export type Task = {
  id: number;
  project_id: number;
  assigned_to: number;
  assigned_to_name?: string;
  title: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  remarks: string;
  start_date: string;
  due_date: string;
};

type Props = {
  isOpen: boolean;
  projectId: number;
  employees: Employee[];
  editingTask?: Task | null;
  onClose: () => void;
  onSaveTask: () => Promise<void>;
};

const AddTaskModal = ({
  isOpen,
  projectId,
  employees,
  editingTask,
  onClose,
  onSaveTask,
}: Props) => {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isTeamMember =
    user.role === "TEAM_MEMBER";

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [assignedTo, setAssignedTo] =
    useState(0);

  const [status, setStatus] =
    useState<
      | "Not Started"
      | "In Progress"
      | "Completed"
    >("Not Started");

  const [priority, setPriority] =
    useState<
      "Low" |
      "Medium" |
      "High"
    >("Medium");

  const [remarks, setRemarks] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setAssignedTo(editingTask.assigned_to);
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setRemarks(editingTask.remarks ?? "");
      setStartDate(editingTask.start_date);
      setDueDate(editingTask.due_date);
    } else {
      setTitle("");
      setDescription("");
      setAssignedTo(
        isTeamMember ? user.id : 0
      );
      setStatus("Not Started");
      setPriority("Medium");
      setRemarks("");
      setStartDate("");
      setDueDate("");
    }
  }, [
    editingTask,
    isOpen,
    isTeamMember,
    user.id,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    if (!isTeamMember && assignedTo === 0) {
      alert("Please select a team member.");
      return;
    }

    const assignedToUserId =
      isTeamMember
        ? user.id
        : assignedTo;

    if (!startDate) {
      alert("Please select a start date.");
      return;
    }

    if (!dueDate) {
      alert("Please select a due date.");
      return;
    }

    if (dueDate < startDate) {
      alert(
        "Due date cannot be earlier than the start date."
      );
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      if (editingTask) {
        await api.put(
          `/tasks/${editingTask.id}`,
          {
            title,
            description,
            assigned_to: assignedToUserId,
            status,
            priority,
            remarks,
            start_date: startDate,
            due_date: dueDate,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await api.post(
          "/tasks",
          {
            project_id: projectId,
            assigned_to: assignedToUserId,
            title,
            description,
            priority,
            start_date: startDate,
            due_date: dueDate,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      await onSaveTask();

      onClose();
    } catch (error) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        alert(
          error.response?.data?.detail ??
            (editingTask
              ? "Failed to update task."
              : "Failed to create task.")
        );
      } else {
        alert(
          editingTask
            ? "Failed to update task."
            : "Failed to create task."
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-slate-800">
            {editingTask
              ? "Edit Task"
              : "Add New Task"}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Fill in the task details below.
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Task Title */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Enter task title"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Assigned To */}

            {!isTeamMember && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigned To
                </label>

                <select
                  value={assignedTo}
                  onChange={(e) =>
                    setAssignedTo(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value={0}>
                    Select Employee
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.user_id}
                      >
                        {employee.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* Priority */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as
                      | "Low"
                      | "Medium"
                      | "High"
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>
              </select>
            </div>

            {/* Status - Edit Only */}

            {editingTask && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "Not Started"
                        | "In Progress"
                        | "Completed"
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
              </div>
            )}

            {/* Start Date */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Due Date */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                min={startDate || undefined}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Description */}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>

              <textarea
                rows={4}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter task description..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 resize-none outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Remarks */}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remarks
              </label>

              <textarea
                rows={3}
                value={remarks}
                onChange={(e) =>
                  setRemarks(e.target.value)
                }
                placeholder="Additional remarks (optional)"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 resize-none outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

          </div>
        </div>

        <div className="flex items-center justify-end gap-4 px-8 py-5 border-t border-gray-200 bg-gray-50 sticky bottom-0">

          <button
            onClick={onClose}
            className="
              px-5
              py-2.5
              rounded-xl
              border
              border-gray-300
              text-gray-700
              font-medium
              hover:bg-gray-100
              transition
            "
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="
              px-6
              py-2.5
              rounded-xl
              bg-blue-600
              text-white
              font-semibold
              hover:bg-blue-700
              transition
              shadow-md
            "
          >
            {editingTask
              ? "Save Changes"
              : "Create Task"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;