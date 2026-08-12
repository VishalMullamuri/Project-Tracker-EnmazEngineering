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
  projects?: number;
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

    // Employees
    const employeeResponse = await api.get("/employees", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const employeeData: Employee[] = employeeResponse.data;

    // Projects
    const projectResponse = await api.get("/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Assignments
    const assignmentResponse = await api.get(
      "/project-employees/all",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const assignments = assignmentResponse.data;

    const projectMap = new Map<number, number>();

    assignments.forEach((item: any) => {
      projectMap.set(
        item.employee_id,
        (projectMap.get(item.employee_id) ?? 0) + 1
      );
    });

    const updatedEmployees = employeeData.map((employee) => ({
      ...employee,
      projects: projectMap.get(employee.id) ?? 0,
    }));

    setEmployees(updatedEmployees);

    setProjectCount(projectResponse.data.length);

    const uniqueEmployees = new Set<number>();

    assignments.forEach((item: any) => {
      uniqueEmployees.add(item.employee_id);
    });

    const assigned = uniqueEmployees.size;

    setAssignedEmployees(assigned);

    setAvailableEmployees(
      Math.max(0, employeeData.length - assigned)
    );
  } catch (error) {
    console.error(error);
  }
};

const refreshEmployees = async (): Promise<void> => {
  await loadDashboard();
};

const refreshDashboard = async (): Promise<void> => {
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
          subtitle="Assigned Employees"
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
          subtitle="Unassigned Employees"
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
  refreshEmployees={refreshEmployees}
  refreshDashboard={refreshDashboard}
/>
    </Layout>
  );
};

export default AdminDashboard;