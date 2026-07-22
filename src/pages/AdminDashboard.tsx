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
};

const AdminDashboard = () => {

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [projectCount, setProjectCount] =
    useState(0);

  const [assignedEmployees, setAssignedEmployees] =
    useState(0);

  const [availableEmployees, setAvailableEmployees] =
    useState(0);

  useEffect(() => {

  const loadData = async () => {

  const employeeData = await fetchEmployees();

  await fetchDashboardData(employeeData);

};

  loadData();

}, []);

  const fetchEmployees = async (): Promise<Employee[]> => {
    

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          "/employees",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const employeeData = response.data;

setEmployees(employeeData);

return employeeData;

    } catch (error) {

  console.error(error);

  return [];

}

  };

  const fetchDashboardData = async (
  employeeData?: Employee[]
) => {

    try {

      const token =
        localStorage.getItem("token");

      const projects =
        await api.get(
          "/projects",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setProjectCount(
        projects.data.length
      );

      const assignments =
  await api.get(
    "/project-employees/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const currentEmployees: Employee[] =
  employeeData ?? (await fetchEmployees());

      const projectMap =
  new Map<number, number>();

assignments.data.forEach(
  (item: any) => {

    projectMap.set(
      item.employee_id,
      (projectMap.get(
        item.employee_id
      ) ?? 0) + 1
    );

  }
);

setEmployees(
  currentEmployees.map((employee) => ({
    ...employee,
    projects:
      projectMap.get(employee.id) ?? 0,
  }))
);
      const uniqueEmployees =
        new Set(
          assignments.data.map(
            (item: any) =>
              item.employee_id
          )
        );

      setAssignedEmployees(
        uniqueEmployees.size
      );

      setAvailableEmployees(
  currentEmployees.length -
    uniqueEmployees.size
);

    } catch (error) {

      console.error(error);

    }

  };

  const user = JSON.parse(
  localStorage.getItem("user") || "{}"
);

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
  refreshEmployees={fetchEmployees}
  refreshDashboard={fetchDashboardData}
  isAdmin={user.role === "ADMIN"}
/>
    </Layout>

  );

};

export default AdminDashboard;