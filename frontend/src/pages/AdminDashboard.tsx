import { useEffect, useState } from "react";
import api from "../api/axios";

import Layout from "../components/layout/Layout";
import SummaryCard from "../components/dashboard/SummaryCard";
import EmployeeTable from "../components/employee/EmployeeTable";

import {
  Users,
  FolderKanban,
  UserCheck,
  UserX,
} from "lucide-react";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "MANAGER" | "TEAM_MEMBER";
  user_id?: number;
  projects?: number;
};

type Project = {
  id: number;
  project_name: string;
  status: string;
  created_by: number;
};

type ProjectAssignment = {
  project_id: number;
  employee_id: number;
};

const AdminDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [assignedEmployees, setAssignedEmployees] = useState(0);
  const [availableEmployees, setAvailableEmployees] = useState(0);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Employees
      const employeeResponse = await api.get(
        "/employees",
        {
          headers,
        }
      );

      const employeeData: Employee[] =
        employeeResponse.data;

      // Projects
      const projectResponse = await api.get(
        "/projects",
        {
          headers,
        }
      );

      const projects: Project[] =
        projectResponse.data;

      // Assignments
      const assignmentResponse =
        await api.get(
          "/project-employees/all",
          {
            headers,
          }
        );

      const assignments: ProjectAssignment[] =
        assignmentResponse.data;

      /*
       * Only projects that are currently active
       * should count toward an employee's Projects.
       *
       * Completed projects are excluded.
       */
      const activeProjects = projects.filter(
        (project) =>
          project.status !== "Completed"
      );

      const activeProjectIds = new Set(
        activeProjects.map(
          (project) => project.id
        )
      );

      /*
       * Team Member project counts.
       *
       * Only count assignments where the project
       * is currently active.
       */
      const projectMap = new Map<
        number,
        number
      >();

      assignments.forEach((item) => {
        if (
          activeProjectIds.has(
            Number(item.project_id)
          )
        ) {
          projectMap.set(
            item.employee_id,
            (projectMap.get(
              item.employee_id
            ) ?? 0) + 1
          );
        }
      });

      /*
       * Manager project counts.
       *
       * A manager's active projects are the
       * projects created by that manager which
       * have not been completed.
       */
      const managerProjectMap = new Map<
        number,
        number
      >();

      activeProjects.forEach((project) => {
        managerProjectMap.set(
          project.created_by,
          (managerProjectMap.get(
            project.created_by
          ) ?? 0) + 1
        );
      });

      const updatedEmployees =
        employeeData.map((employee) => {
          let activeProjectCount = 0;

          if (employee.role === "MANAGER") {
            activeProjectCount =
              managerProjectMap.get(
                employee.user_id ?? 0
              ) ?? 0;
          } else if (
            employee.role === "TEAM_MEMBER"
          ) {
            activeProjectCount =
              projectMap.get(
                employee.id
              ) ?? 0;
          }

          return {
            ...employee,
            projects: activeProjectCount,
          };
        });

      setEmployees(updatedEmployees);

      setProjectCount(
        projects.length
      );

      /*
       * Employees are considered assigned only
       * when they currently have at least one
       * active project.
       */
      const activeAssignedEmployeeIds =
        new Set<number>();

      assignments.forEach((item) => {
        if (
          activeProjectIds.has(
            Number(item.project_id)
          )
        ) {
          activeAssignedEmployeeIds.add(
            item.employee_id
          );
        }
      });

      /*
       * Managers with active projects are also
       * considered assigned.
       */
      employeeData.forEach((employee) => {
        if (
          employee.role === "MANAGER" &&
          (managerProjectMap.get(
            employee.user_id ?? 0
          ) ?? 0) > 0
        ) {
          activeAssignedEmployeeIds.add(
            employee.id
          );
        }
      });

      const assigned =
        activeAssignedEmployeeIds.size;

      setAssignedEmployees(
        assigned
      );

      setAvailableEmployees(
        Math.max(
          0,
          employeeData.length - assigned
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const refreshEmployees =
    async (): Promise<void> => {
      await loadDashboard();
    };

  const refreshDashboard =
    async (): Promise<void> => {
      await loadDashboard();
    };

  return (
    <Layout>
      <div className="grid grid-cols-4 gap-5">
        <SummaryCard
          title="Employees"
          value={employees.length}
          subtitle="Total Employees"
          icon={
            <Users
              size={28}
              className="text-blue-600"
            />
          }
          iconBg="bg-blue-100"
        />

        <SummaryCard
          title="Projects"
          value={projectCount}
          subtitle="Total Projects"
          icon={
            <FolderKanban
              size={28}
              className="text-green-600"
            />
          }
          iconBg="bg-green-100"
        />

        <SummaryCard
          title="Assigned"
          value={assignedEmployees}
          subtitle="Currently Assigned"
          icon={
            <UserCheck
              size={28}
              className="text-purple-600"
            />
          }
          iconBg="bg-purple-100"
        />

        <SummaryCard
          title="Available"
          value={availableEmployees}
          subtitle="No Active Projects"
          icon={
            <UserX
              size={28}
              className="text-orange-600"
            />
          }
          iconBg="bg-orange-100"
        />
      </div>

      <EmployeeTable
        employees={employees}
        refreshEmployees={
          refreshEmployees
        }
        refreshDashboard={
          refreshDashboard
        }
      />
    </Layout>
  );
};

export default AdminDashboard;