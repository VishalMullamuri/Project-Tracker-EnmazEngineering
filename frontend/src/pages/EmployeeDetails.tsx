import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axios";
import Pagination from "../components/dashboard/Pagination";
import Layout from "../components/layout/Layout";
import EditEmployeeModal from "../components/employee/EditEmployeeModal";

import {
  ArrowLeft,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Eye,
  FolderKanban,
  ListChecks,
  Clock3,
  Loader2,
  CheckCircle2,
  Shield,
  FolderX,
} from "lucide-react";

type Employee = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "MANAGER" | "TEAM_MEMBER";
};

type Project = {
  id: number;
  project_name: string;
  status: string;
  created_by: number;
};

type Task = {
  id: number;
  title: string;
  status: string;
};

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return initials.toUpperCase();
};

const getAvatarColor = (name: string) => {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const roleLabels: Record<string, string> = {
  MANAGER: "Manager",
  TEAM_MEMBER: "Team Member",
  ADMIN: "Admin",
};

const statusStyles: Record<string, string> = {
  Completed: "bg-green-100 text-green-700",
  Delayed: "bg-red-100 text-red-700",
};

const EmployeeDetails = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const { id } = useParams();

  const [employee, setEmployee] =
    useState<Employee | null>(
      location.state?.employee ?? null
    );

  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [assignedTasks, setAssignedTasks] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [inProgressTasks, setInProgressTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const projectsPerPage = 3;

  const fetchEmployee = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get(`/employees/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployee(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeData = async () => {
    if (!employee) return;

    try {
      const token = localStorage.getItem("token");

      const projectResponse = await api.get("/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (employee.role === "MANAGER") {
        setProjects(
          projectResponse.data.filter(
            (project: Project) =>
              project.created_by === employee.user_id
          )
        );
      } else {
        const assignments = await api.get(
          "/project-employees/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const employeeProjects = assignments.data
          .filter(
            (item: any) => item.employee_id === employee.id
          )
          .map((item: any) => item.project_id);

        setProjects(
          projectResponse.data.filter((project: Project) =>
            employeeProjects.includes(project.id)
          )
        );
      }

      const taskResponse = await api.get("/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const employeeTasks = taskResponse.data.filter(
        (task: any) => task.assigned_to === employee.user_id
      );

      setAssignedTasks(employeeTasks.length);

      setCompletedTasks(
        employeeTasks.filter(
          (task: Task) => task.status === "Completed"
        ).length
      );

      setPendingTasks(
        employeeTasks.filter(
          (task: Task) => task.status === "Not Started"
        ).length
      );

      setInProgressTasks(
        employeeTasks.filter(
          (task: Task) => task.status === "In Progress"
        ).length
      );

      const completed = employeeTasks.filter(
        (task: Task) => task.status === "Completed"
      ).length;

      setCompletionRate(
        employeeTasks.length === 0
          ? 0
          : Math.round(
              (completed / employeeTasks.length) * 100
            )
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (employee) {
      fetchEmployeeData();
    }
  }, [employee]);

  const updateEmployee = async (updatedEmployee: {
    name: string;
    email: string;
    phone: string;
  }) => {
    if (!employee) return;

    try {
      const token = localStorage.getItem("token");

      await api.put(
        `/employees/${employee.id}`,
        updatedEmployee,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchEmployee();

      setEditOpen(false);
    } catch (error) {
      console.error(error);

      alert("Failed to update employee.");
    }
  };

  const deleteEmployee = async () => {
    if (!employee) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/employees/${employee.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Employee deleted successfully.");

      navigate("/admin");
    } catch (error) {
      console.error(error);

      alert("Failed to delete employee.");
    }
  };

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;

  const currentProjects = projects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );

  const totalPages = Math.ceil(projects.length / projectsPerPage);

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-sm text-slate-500">Loading...</div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="p-6 text-sm text-slate-500">Employee not found.</div>
      </Layout>
    );
  }

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin = user.role === "ADMIN";

  return (
    <Layout>
      <EditEmployeeModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        employee={employee}
        onUpdateEmployee={updateEmployee}
      />

      {/* Breadcrumb */}

      <button
        onClick={() => navigate("/admin")}
        className="group flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-4"
      >
        <ArrowLeft
          size={16}
          strokeWidth={2}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        <span className="hover:underline">Employees</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{employee.name}</span>
      </button>

      {/* Header Card */}

      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
        <div className="flex justify-between items-start gap-6 flex-wrap">

          <div className="flex items-start gap-4 min-w-0">

            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-semibold shrink-0 ${getAvatarColor(
                employee.name
              )}`}
            >
              {getInitials(employee.name)}
            </div>

            <div className="min-w-0">

              <h1 className="text-2xl font-bold text-slate-900 leading-tight truncate">
                {employee.name}
              </h1>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Mail size={16} strokeWidth={1.75} className="text-blue-600" />
                  {employee.email}
                </div>

                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Shield size={16} strokeWidth={1.75} className="text-blue-600" />
                  {roleLabels[employee.role] ?? employee.role}
                </div>

                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Phone size={16} strokeWidth={1.75} className="text-blue-600" />
                  {employee.phone}
                </div>
              </div>

            </div>

          </div>

          <div className="flex items-center gap-2 shrink-0">

            <button
              onClick={() =>
                navigate(`/employee/${employee.id}/worksheet`)
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <Eye size={15} strokeWidth={2} />
              Worksheet
            </button>

            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Pencil size={15} strokeWidth={2} />
              Edit
            </button>

            {isAdmin && (
              <button
                onClick={deleteEmployee}
                title="Delete employee"
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>
            )}

          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* Employee Summary */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">

          <h2 className="text-base font-semibold text-slate-900 mb-5">
            Employee Summary
          </h2>

          <div className="space-y-1">

            {[
              {
                icon: FolderKanban,
                color: "text-blue-600 bg-blue-50",
                label: "Assigned Projects",
                value: projects.length,
                valueColor: "text-slate-900",
              },
              {
                icon: ListChecks,
                color: "text-slate-600 bg-slate-100",
                label: "Assigned Tasks",
                value: assignedTasks,
                valueColor: "text-slate-900",
              },
              {
                icon: Clock3,
                color: "text-orange-500 bg-orange-50",
                label: "Not Started Tasks",
                value: pendingTasks,
                valueColor: "text-orange-500",
              },
              {
                icon: Loader2,
                color: "text-blue-600 bg-blue-50",
                label: "In Progress",
                value: inProgressTasks,
                valueColor: "text-blue-600",
              },
              {
                icon: CheckCircle2,
                color: "text-green-600 bg-green-50",
                label: "Completed Tasks",
                value: completedTasks,
                valueColor: "text-green-600",
              },
            ].map((row, i) => {
              const RowIcon = row.icon;
              return (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${row.color}`}
                    >
                      <RowIcon size={16} strokeWidth={1.75} />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {row.label}
                    </span>
                  </div>

                  <span className={`text-lg font-bold ${row.valueColor}`}>
                    {row.value}
                  </span>
                </div>
              );
            })}

            <div className="pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  Completion Rate
                </span>

                <span className="text-sm font-bold text-blue-600">
                  {completionRate}%
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>
            </div>

          </div>

        </div>

        {/* Assigned Projects */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">
              Assigned Projects
            </h2>

            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              {projects.length} Projects
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <FolderX size={40} strokeWidth={1.5} className="text-slate-300 mb-3" />

              <h3 className="text-sm font-semibold text-slate-700">
                No Projects Assigned
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                This employee has not been assigned to any project yet.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {currentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-blue-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FolderKanban size={18} strokeWidth={1.75} className="text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {project.project_name}
                        </h3>

                        <p className="text-xs text-slate-500">
                          Project ID #{project.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        statusStyles[project.status] ??
                        "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>

              {projects.length > projectsPerPage && (
                <div className="mt-5 flex justify-end">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default EmployeeDetails;
