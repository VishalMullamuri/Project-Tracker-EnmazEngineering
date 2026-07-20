import { useEffect, useState } from "react";

import api from "../../api/axios";
import type { Project } from "../../types/project";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProjectUpdated: () => void;
};

const EditProjectModal = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}: Props) => {

  const [projectName, setProjectName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

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

      const token =
        localStorage.getItem("token");

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

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">

        <div className="border-b px-8 py-6">

          <h2 className="text-3xl font-bold text-slate-800">
            Edit Project
          </h2>

        </div>

        <div className="p-8">

          <div className="grid grid-cols-2 gap-8">
            {/* LEFT COLUMN */}

<div className="space-y-6">

  {/* Project Name */}

  <div>

    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Project Name
    </label>

    <input
      type="text"
      value={projectName}
      onChange={(e) =>
        setProjectName(e.target.value)
      }
      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    />

  </div>

  {/* Description */}

  <div>

    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Description
    </label>

    <textarea
      rows={9}
      value={description}
      onChange={(e) =>
        setDescription(e.target.value)
      }
      className="w-full rounded-xl border border-gray-300 px-4 py-3 resize-none outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    />

  </div>

</div>

{/* RIGHT COLUMN */}

<div className="space-y-6">

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

  {/* End Date */}

  <div>

    <label className="block text-sm font-semibold text-gray-700 mb-2">
      End Date
    </label>

    <input
      type="date"
      value={endDate}
      onChange={(e) =>
        setEndDate(e.target.value)
      }
      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
    />

  </div>

</div>

</div>

</div>
        {/* Footer */}

        <div className="mt-10 border-t border-gray-200 px-8 py-6">

          <div className="flex justify-end gap-4">

            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Update Project
            </button>

          </div>

        </div>

      </div>

    </div>

  );

};

export default EditProjectModal;