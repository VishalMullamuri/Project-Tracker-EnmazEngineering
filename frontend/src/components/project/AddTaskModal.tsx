import { useEffect, useState } from "react";
import { ClipboardList, X } from "lucide-react";
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
  created_by: number;
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

const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400";

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
            status,
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
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 shrink-0">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <ClipboardList size={20} strokeWidth={1.75} className="text-blue-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingTask ? "Edit Task" : "Add New Task"}
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the task details below
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>

        </div>

        {/* Body */}

        <div className="px-8 py-6 overflow-y-auto flex-1">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Task Title */}

            <div>
              <label className={labelClass}>Task Title</label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className={inputClass}
              />
            </div>

            {/* Assigned To */}

            {!isTeamMember && (
              <div>
                <label className={labelClass}>Assigned To</label>

                <select
                  value={assignedTo}
                  onChange={(e) =>
                    setAssignedTo(Number(e.target.value))
                  }
                  className={`${inputClass} bg-white`}
                >
                  <option value={0}>Select Employee</option>

                  {employees.map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.user_id}
                    >
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}

            <div>
              <label className={labelClass}>Priority</label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as "Low" | "Medium" | "High"
                  )
                }
                className={`${inputClass} bg-white`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Status */}

            <div>
              <label className={labelClass}>Status</label>

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
                className={`${inputClass} bg-white`}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Start Date */}

            <div>
              <label className={labelClass}>Start Date</label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Due Date */}

            <div>
              <label className={labelClass}>Due Date</label>

              <input
                type="date"
                value={dueDate}
                min={startDate || undefined}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Description */}

            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>

              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Remarks */}

            <div className="md:col-span-2">
              <label className={labelClass}>Remarks</label>

              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional remarks (optional)"
                className={`${inputClass} resize-none`}
              />
            </div>

          </div>
        </div>

        {/* Footer */}

        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-200 bg-slate-50 shrink-0">

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            {editingTask ? "Save Changes" : "Create Task"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
