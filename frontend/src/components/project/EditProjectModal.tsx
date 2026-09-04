import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

import api from "../../api/axios";
import type { Project } from "../../types/project";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProjectUpdated: () => void;
};

const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow";

const EditProjectModal = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}: Props) => {

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {

    if (project) {
      setProjectName(project.project_name);
      setDescription(project.description);
      setStartDate(project.start_date);
      setEndDate(project.end_date);
    }

  }, [project]);

  if (!isOpen) return null;

  const handleUpdate = async () => {

    if (!projectName.trim()) {
      alert("Project Name is required");
      return;
    }

    if (!description.trim()) {
      alert("Description is required");
      return;
    }

    if (!startDate) {
      alert("Please select a Start Date");
      return;
    }

    if (!endDate) {
      alert("Please select an End Date");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("End Date cannot be before Start Date");
      return;
    }

    try {

      const token = localStorage.getItem("token");

      await api.put(
        `/projects/${project.id}`,
        {
          project_name: projectName,
          description,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Project updated successfully.");

      onProjectUpdated();
      onClose();

    } catch (error) {

      console.error(error);
      alert("Failed to update project.");

    }

  };

  return (

    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 shrink-0">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Pencil size={18} strokeWidth={1.75} className="text-blue-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Edit Project
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Update the project details below
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left Column */}

            <div className="space-y-5">

              <div>
                <label className={labelClass}>Project Name</label>

                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>

                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

            </div>

            {/* Right Column */}

            <div className="space-y-5">

              <div>
                <label className={labelClass}>Start Date</label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>End Date</label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-200 bg-slate-50 shrink-0">

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdate}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            Update Project
          </button>

        </div>

      </div>

    </div>

  );

};

export default EditProjectModal;
