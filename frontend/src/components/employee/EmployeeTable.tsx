import { useState } from "react";
import { Search, Eye, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api/axios";
import { apiErrorMessage } from "../../utils/apiErrorMessage";
import Pagination from "../dashboard/Pagination";
import AddEmployeeModal from "./AddEmployeeModal";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "MANAGER" | "TEAM_MEMBER";
  projects?: number;
};

type Props = {
  employees: Employee[];
  refreshEmployees: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
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

const roleStyles: Record<string, string> = {
  MANAGER: "bg-purple-100 text-purple-700",
  TEAM_MEMBER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-slate-100 text-slate-700",
};

const roleLabels: Record<string, string> = {
  MANAGER: "Manager",
  TEAM_MEMBER: "Team Member",
  ADMIN: "Admin",
};

const EmployeeTable = ({
  employees,
  refreshEmployees,
  refreshDashboard,
}: Props) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);

  const employeesPerPage = 5;

  const createEmployee = async (employee: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "MANAGER" | "TEAM_MEMBER";
  }) => {
    try {
      const token = localStorage.getItem("token");

      await api.post(
        "/employees",
        employee,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await refreshEmployees();
      await refreshDashboard();

      setOpenModal(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(
          apiErrorMessage(
            error.response?.data?.detail
          )
        );
      } else {
        alert("Failed to create employee.");
      }

      throw error;
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    return (
      employee.name.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;

  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  const totalPages = Math.ceil(
    filteredEmployees.length / employeesPerPage
  );

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <AddEmployeeModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onAddEmployee={createEmployee}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mt-6 overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-wrap gap-3">

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-64 pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setOpenModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              + Add Employee
            </button>
          )}

        </div>

        <table className="w-full">

          <thead className="bg-slate-50">

            <tr className="text-[11px] uppercase tracking-wider text-slate-500">

              <th className="py-3 text-center w-16 font-semibold">Sl.No.</th>
              <th className="py-3 text-left font-semibold">Employee Name</th>
              <th className="py-3 text-left font-semibold">Email</th>
              <th className="py-3 text-center w-40 font-semibold">Role</th>
              <th className="py-3 text-center w-36 font-semibold">Phone</th>
              <th className="py-3 text-center w-36 font-semibold">Active Projects</th>
              <th className="py-3 text-center w-24 font-semibold">Action</th>

            </tr>

          </thead>

          <tbody>

            {currentEmployees.map((employee, index) => (

              <tr
                key={employee.id}
                className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors"
              >

                <td className="py-3 text-center text-sm text-slate-500">
                  {indexOfFirstEmployee + index + 1}
                </td>

                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getAvatarColor(
                        employee.name
                      )}`}
                    >
                      {getInitials(employee.name)}
                    </div>

                    <span className="text-sm font-medium text-slate-800">
                      {employee.name}
                    </span>
                  </div>
                </td>

                <td className="py-3 text-sm text-slate-600">
                  {employee.email}
                </td>

                <td className="py-3 text-center">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      roleStyles[employee.role] ??
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {roleLabels[employee.role] ?? employee.role}
                  </span>
                </td>

                <td className="py-3 text-center text-sm text-slate-600">
                  {employee.phone}
                </td>

                <td className="py-3 text-center text-sm font-medium text-slate-700">
                  {employee.projects ?? 0}
                </td>

                <td className="py-3 text-center">
                  <button
                    onClick={() =>
                      navigate(`/employee/${employee.id}`, {
                        state: {
                          employee,
                        },
                      })
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {filteredEmployees.length === 0 && (

          <div className="py-14 flex flex-col items-center justify-center">
            <Users size={40} strokeWidth={1.5} className="text-slate-300 mb-3" />

            <h3 className="text-sm font-semibold text-slate-700">
              No Employees Found
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              Try changing your search or add a new employee.
            </p>
          </div>

        )}

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50">

          <p className="text-xs text-slate-500">
            Showing
            <span className="font-semibold text-slate-700 mx-1">
              {filteredEmployees.length}
            </span>
            employee(s)
          </p>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

        </div>

      </div>
    </>
  );
};

export default EmployeeTable;
