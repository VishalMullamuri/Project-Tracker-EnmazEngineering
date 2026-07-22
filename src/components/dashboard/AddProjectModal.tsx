import { useState } from "react";

export type CreateProject = {
  project_name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: CreateProject) => Promise<void>;
};

const AddProjectModal = ({
  isOpen,
  onClose,
  onAddProject,
}: Props) => {

  const [projectName, setProjectName] = useState("");

  const [status, setStatus] =
  useState("Not Started");

  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  if (!isOpen) return null;

const handleSubmit = async () => {

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

await onAddProject({
  project_name: projectName,
  description,
  status,
  start_date: startDate,
  end_date: endDate,
});

  setProjectName("");
  setDescription("");
  setStartDate("");
  setEndDate("");

  onClose();
};

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">

        <h2 className="text-2xl font-bold mb-8">
          Add New Project
        </h2>

        <div className="space-y-5">

          {/* Project Name */}

          <div>

            <label className="block mb-2 font-medium">
              Project Name
            </label>

            <input
              type="text"
              placeholder="Enter Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>
          <div>
  <label className="block mb-2 font-medium">
    Description
  </label>

  <textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
    rows={3}
  />
</div>

{/* Status */}

<div>

  <label className="block mb-2 font-medium">
    Status
  </label>

  <select
    value={status}
    onChange={(e) =>
      setStatus(e.target.value)
    }
    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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

    <option value="Delayed">
      Delayed
    </option>

  </select>

</div>

          {/* Start Date */}

          <div>

            <label className="block mb-2 font-medium">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

          {/* Delivery Date */}

          <div>

            <label className="block mb-2 font-medium">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
  setEndDate(e.target.value)
}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

        {/* Buttons */}

<div className="flex justify-end gap-4 mt-8">

  <button
    onClick={onClose}
    className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition"
  >
    Cancel
  </button>

  <button
    onClick={handleSubmit}
    className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
  >
    Save Project
  </button>

</div>
      </div>

    </div>
  );
};

export default AddProjectModal;