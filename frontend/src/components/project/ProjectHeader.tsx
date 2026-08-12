import {
  ArrowLeft,
  Calendar,
  Flag,
  Pencil,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ManageTeamModal from "./ManageTeamModal";
import api from "../../api/axios";
import type { Project } from "../../types/project";

import EditProjectModal from "./EditProjectModal";

type Props = {
  project: Project;
  onProjectUpdated: () => Promise<void>;
};

const ProjectHeader = ({
  project,
  onProjectUpdated,
}: Props) => {
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [teamOpen, setTeamOpen] =
  useState(false);
  const user = JSON.parse(
  localStorage.getItem("user") || "{}"
);

const isManager =
  user.role === "MANAGER" ||
  user.role === "ADMIN";

  const progress = project.progress ?? 0;

  const priority =
    progress >= 80
      ? "Low"
      : progress >= 40
      ? "Medium"
      : "High";


  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/projects/${project.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Project deleted successfully.");

      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      alert("Failed to delete project.");
    }
  };
  return (
    <>
      {/* Back Button */}

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition mb-5"
      >
        <ArrowLeft size={18} />
        Back to Projects
      </button>

      {/* Header Card */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

        <div className="flex justify-between items-start gap-8">

          {/* Left Section */}

          <div className="flex-1">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                📁
              </div>

              <div className="flex items-start justify-between w-full">

                {/* Project Info */}

                <div>

                  <h1 className="text-3xl font-bold text-slate-800">
                    {project.project_name}
                  </h1>

                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : project.status === "Delayed"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {project.status}
                  </span>

                </div>

                {/* Action Buttons */}

{isManager && (

  <div className="flex gap-3">

    <button
      onClick={() => setTeamOpen(true)}
      className="
        flex
        items-center
        gap-2
        px-4
        py-2
        rounded-lg
        bg-blue-600
        text-white
        hover:bg-blue-700
        transition
      "
    >
      Team Members
    </button>

    <button
      onClick={() => setEditOpen(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition"
    >
      <Pencil size={16} />
      Edit
    </button>

    <button
      onClick={handleDelete}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
    >
      <Trash2 size={16} />
      Delete
    </button>

  </div>

)}
              </div>

            </div>

           <div className="mt-5 space-y-3">

  <p className="text-sm text-gray-600 leading-7">
    {project.description}
  </p>

  <p className="text-sm text-gray-500 leading-7">
    This project is currently in the{" "}
    <span className="font-semibold text-gray-700">
      {project.status}
    </span>{" "}
    stage and is scheduled to be delivered on{" "}
    <span className="font-semibold text-gray-700">
      {project.end_date}
    </span>
  </p>

</div>

          </div>

          {/* Progress */}

          <div className="w-60">

            <div className="flex justify-between mb-2">

              <span className="text-sm font-medium">
                Completion
              </span>

              <span className="text-sm font-semibold text-blue-600">
                {progress}%
              </span>

            </div>

            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">

              <div
                className="h-full bg-blue-600 rounded-full"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>

        </div>
                {/* Footer */}

        <div className="mt-6 pt-5 border-t border-gray-200 flex gap-10">

          {/* Start Date */}

          <div className="flex items-center gap-3">

            <Calendar
              size={18}
              className="text-blue-600"
            />

            <div>

              <p className="text-xs text-gray-500">
                Start Date
              </p>

              <p className="font-medium">
                {project.start_date}
              </p>

            </div>

          </div>

          {/* End Date */}

          <div className="flex items-center gap-3">

            <Calendar
              size={18}
              className="text-blue-600"
            />

            <div>

              <p className="text-xs text-gray-500">
                End Date
              </p>

              <p className="font-medium">
                {project.end_date}
              </p>

            </div>

          </div>

          {/* Priority */}

          <div className="flex items-center gap-3">

            <Flag
              size={18}
              className="text-red-500"
            />

            <div>

              <p className="text-xs text-gray-500">
                Priority
              </p>

              <p
                className={`font-medium ${
                  priority === "High"
                    ? "text-red-500"
                    : priority === "Medium"
                    ? "text-orange-500"
                    : "text-green-600"
                }`}
              >
                {priority}
              </p>

            </div>

          </div>

        </div>

      </div>
{isManager && (
  <>
    <ManageTeamModal
      isOpen={teamOpen}
      projectId={project.id}
      onClose={() =>
        setTeamOpen(false)
      }
      onSaved={onProjectUpdated}
    />

    <EditProjectModal
      isOpen={editOpen}
      onClose={() => setEditOpen(false)}
      project={project}
      onProjectUpdated={onProjectUpdated}
    />
  </>
)}

    </>
  );
};

export default ProjectHeader;