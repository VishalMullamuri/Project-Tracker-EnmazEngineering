import {
  ArrowLeft,
  Calendar,
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

const statusStyles: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Delayed: "bg-red-100 text-red-700",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const ProjectHeader = ({
  project,
  onProjectUpdated,
}: Props) => {
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

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
      {/* Breadcrumb */}

      <button
        onClick={() => navigate("/dashboard")}
        className="group flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-4"
      >
        <ArrowLeft
          size={16}
          strokeWidth={2}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        <span className="hover:underline">Projects</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">
          {project.project_name}
        </span>
      </button>

      {/* Header Card */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">

        <div className="flex justify-between items-start gap-6 flex-wrap">

          {/* Left: icon + title/status */}

          <div className="flex items-start gap-4 min-w-0">

            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">
              📁
            </div>

            <div className="min-w-0">

              <h1 className="text-2xl font-bold text-slate-900 leading-tight truncate">
                {project.project_name}
              </h1>

              <div className="flex items-center gap-2 mt-2">

                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    statusStyles[project.status] ??
                    "bg-blue-100 text-blue-700"
                  }`}
                >
                  {project.status}
                </span>

                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${priorityStyles[priority]}`}
                >
                  {priority} priority
                </span>

              </div>

            </div>

          </div>

          {/* Right: actions */}

          {isManager && (
            <div className="flex items-center gap-2 shrink-0">

              <button
                onClick={() => setTeamOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                + Add Team Members
              </button>

              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <Pencil size={15} strokeWidth={2} />
                Edit
              </button>

              <button
                onClick={handleDelete}
                title="Delete project"
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>

            </div>
          )}

        </div>

        {/* Description */}

        <div className="mt-5 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Description
          </p>

          <p className="text-sm leading-6 text-slate-600">
            {project.description}
          </p>
        </div>

        {/* Progress — full width, no longer squeezed */}

        <div className="mt-5">

          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Completion
            </span>

            <span className="text-sm font-semibold text-blue-600">
              {progress}%
            </span>
          </div>

          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

        </div>

        {/* Footer — dates */}

        <div className="mt-6 pt-5 border-t border-slate-100 flex gap-10 flex-wrap">

          <div className="flex items-center gap-3">
            <Calendar size={18} strokeWidth={1.75} className="text-blue-600" />

            <div>
              <p className="text-xs text-slate-400">Start Date</p>
              <p className="text-sm font-medium text-slate-800">
                {project.start_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={18} strokeWidth={1.75} className="text-blue-600" />

            <div>
              <p className="text-xs text-slate-400">End Date</p>
              <p className="text-sm font-medium text-slate-800">
                {project.end_date}
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
            onClose={() => setTeamOpen(false)}
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
