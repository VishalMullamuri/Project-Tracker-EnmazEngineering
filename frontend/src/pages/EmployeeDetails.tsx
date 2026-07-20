import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
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
} from "lucide-react";

type Employee = {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
};

type Project = {
  id: number;
  project_name: string;
  status: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
};  

const EmployeeDetails = () => {

  const navigate = useNavigate();

  const location = useLocation();

  const [employee, setEmployee] =
    useState<Employee>(
      location.state.employee
    );

  const [editOpen, setEditOpen] =
    useState(false);

  const [projects, setProjects] =
  useState<Project[]>([]);



const [completedTasks, setCompletedTasks] =
  useState(0);

const [assignedTasks, setAssignedTasks] =
  useState(0);

const [completionRate, setCompletionRate] =
  useState(0);

const [pendingTasks, setPendingTasks] =
  useState(0);

const [inProgressTasks, setInProgressTasks] =
  useState(0);

const [currentPage, setCurrentPage] =
  useState(1);

const projectsPerPage = 3;

  useEffect(() => {

  fetchEmployee();
  fetchEmployeeData();

}, []);

const fetchEmployeeData = async () => {

  try {

    const token =
      localStorage.getItem("token");

    const assignments =
      await api.get(
        "/project-employees/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    const employeeProjects =
      assignments.data
        .filter(
          (item: any) =>
            item.employee_id ===
            employee.id
        )
        .map(
          (item: any) =>
            item.project_id
        );

    const projectResponse =
      await api.get(
        "/projects",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    setProjects(

      projectResponse.data.filter(
        (project: Project) =>
          employeeProjects.includes(
            project.id
          )
      )

    );

    const taskResponse =
      await api.get(
        "/tasks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    const employeeTasks =
  taskResponse.data.filter(
    (task: any) =>
      task.assigned_to ===
      employee.user_id
  );

    setAssignedTasks(
  employeeTasks.length
);

    setCompletedTasks(

      employeeTasks.filter(
        (task: Task) =>
          task.status ===
          "Completed"
      ).length

    );

    setPendingTasks(

      employeeTasks.filter(
        (task: Task) =>
          task.status ===
          "Pending"
      ).length

    );

    setInProgressTasks(

      employeeTasks.filter(
        (task: Task) =>
          task.status ===
          "In Progress"
      ).length

    );

    const completed =
  employeeTasks.filter(
    (task: Task) =>
      task.status ===
      "Completed"
  ).length;

setCompletionRate(

  employeeTasks.length === 0
    ? 0
    : Math.round(
        (completed /
          employeeTasks.length) *
          100
      )

);

  } catch (error) {

    console.error(error);

  }

};
  const fetchEmployee = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          `/employees/${employee.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setEmployee(response.data);

    } catch (error) {

      console.error(error);

    }

  };

  const updateEmployee = async (
    updatedEmployee: {
      name: string;
      email: string;
      phone: string;
    }
  ) => {

    try {

      const token =
        localStorage.getItem("token");

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

      alert(
        "Failed to update employee."
      );

    }

  };

  const deleteEmployee = async () => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this employee?"
      );

    if (!confirmDelete) return;

    try {

      const token =
        localStorage.getItem("token");

      await api.delete(
        `/employees/${employee.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        "Employee deleted successfully."
      );

      navigate("/admin");

    } catch (error) {

      console.error(error);

      alert(
        "Failed to delete employee."
      );

    }

  };

  const indexOfLastProject =
  currentPage * projectsPerPage;

const indexOfFirstProject =
  indexOfLastProject - projectsPerPage;

const currentProjects =
  projects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );

const totalPages =
  Math.ceil(
    projects.length /
      projectsPerPage
  );

  return (

    <Layout>

      <EditEmployeeModal
  isOpen={editOpen}
  onClose={() =>
    setEditOpen(false)
  }
  employee={employee}
  onUpdateEmployee={
    updateEmployee
  }
/>
              <button
        onClick={() => navigate("/admin")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition mb-5"
      >

        <ArrowLeft size={18} />

        Back to Employees

      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

        <div className="flex justify-between items-start">

          <div>

            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-3xl mb-4">
              👤
            </div>

            <h1 className="text-3xl font-bold text-slate-800">
              {employee.name}
            </h1>

            <div className="mt-5 space-y-4">

              <div className="flex items-center gap-3">

                <Mail
                  size={18}
                  className="text-blue-600"
                />

                <span className="text-gray-700">
                  {employee.email}
                </span>

              </div>

              <div className="flex items-center gap-3">

                <Phone
                  size={18}
                  className="text-blue-600"
                />

                <span className="text-gray-700">
                  {employee.phone}
                </span>

              </div>

            </div>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                setEditOpen(true)
              }
              className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-lg
                bg-yellow-500
                text-white
                hover:bg-yellow-600
                transition
              "
            >

              <Pencil size={16} />

              Edit

            </button>

            <button
              onClick={deleteEmployee}
              className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-lg
                bg-red-600
                text-white
                hover:bg-red-700
                transition
              "
            >

              <Trash2 size={16} />

              Delete

            </button>

          </div>

        </div>

      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

          <h2 className="text-xl font-semibold mb-5">
            Employee Summary
          </h2>

          <div className="space-y-5">

  <div className="flex justify-between items-center pb-3 border-b">

    <span className="text-gray-600 font-medium">
      📁 Assigned Projects
    </span>

    <span className="text-xl font-bold text-slate-800">
      {projects.length}
    </span>

  </div>

  <div className="flex justify-between items-center pb-3 border-b">

    <span className="text-gray-600 font-medium">
      📋 Assigned Tasks
    </span>

    <span className="text-xl font-bold text-slate-800">
      {assignedTasks}
    </span>

  </div>

  <div className="flex justify-between items-center pb-3 border-b">

    <span className="text-gray-600 font-medium">
      ⏳ Pending Tasks
    </span>

    <span className="text-xl font-bold text-orange-500">
      {pendingTasks}
    </span>

  </div>

  <div className="flex justify-between items-center pb-3 border-b">

    <span className="text-gray-600 font-medium">
      🚧 In Progress
    </span>

    <span className="text-xl font-bold text-blue-600">
      {inProgressTasks}
    </span>

  </div>

  <div className="flex justify-between items-center pb-5">

    <span className="text-gray-600 font-medium">
      ✅ Completed Tasks
    </span>

    <span className="text-xl font-bold text-green-600">
      {completedTasks}
    </span>

  </div>

  <div>

    <div className="flex justify-between mb-2">

      <span className="text-gray-600 font-medium">
        Completion Rate
      </span>

      <span className="font-bold text-blue-600">
        {completionRate}%
      </span>

    </div>

    <div className="h-3 rounded-full bg-gray-200 overflow-hidden">

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

<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

          <div className="flex items-center justify-between mb-5">

  <h2 className="text-xl font-semibold">
    Assigned Projects
  </h2>

  <span
    className="
      px-3
      py-1
      rounded-full
      bg-blue-100
      text-blue-700
      text-sm
      font-semibold
    "
  >
    {projects.length} Projects
  </span>

</div>

          {projects.length === 0 ? (

  <div className="flex flex-col items-center justify-center py-12 text-gray-500">

    <div className="text-5xl mb-3">
      📁
    </div>

    <h3 className="text-lg font-semibold text-gray-700">
      No Projects Assigned
    </h3>

    <p className="text-sm mt-1">
      This employee has not been assigned to any project yet.
    </p>

  </div>

) : (

  <>

    <div className="space-y-4">

      {currentProjects.map((project) => (

        <div
  key={project.id}
  className="
    flex
    items-center
    justify-between
    p-5
    rounded-xl
    border
    border-gray-200
    bg-white
    hover:shadow-md
    hover:border-blue-300
    transition-all
    duration-300
  "
>

  <div className="flex items-center gap-4">

    <div
      className="
        w-12
        h-12
        rounded-xl
        bg-blue-100
        flex
        items-center
        justify-center
        text-xl
      "
    >
      📁
    </div>

    <div>

      <h3 className="font-semibold text-slate-800">
        {project.project_name}
      </h3>

      <p className="text-sm text-gray-500">
  Project ID #{project.id}
</p>

    </div>

  </div>

  <span
  className={`

    px-3
    py-1
    rounded-full
    text-xs
    font-semibold

    ${
      project.status === "Completed"
        ? "bg-green-100 text-green-700"

        : project.status === "Delayed"

        ? "bg-red-100 text-red-700"

        : "bg-blue-100 text-blue-700"

    }

  `}
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