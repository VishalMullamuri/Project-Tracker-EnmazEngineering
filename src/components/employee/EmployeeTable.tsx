import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";

import Pagination from "../dashboard/Pagination";
import AddEmployeeModal from "./AddEmployeeModal";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  projects?: number;
};

type Props = {
  employees: Employee[];
  refreshEmployees: () => Promise<any>;
  refreshDashboard: () => Promise<any>;
  isAdmin: boolean;
};

const EmployeeTable = ({
  employees,
  refreshEmployees,
  refreshDashboard,
  isAdmin,
}: Props) => {

  const navigate = useNavigate();

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [openModal, setOpenModal] =
    useState(false);

  const employeesPerPage = 5;

  const createEmployee = async (
  employee: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "MANAGER" | "TEAM_MEMBER";
  }
) => {

    try {

      const token =
        localStorage.getItem("token");
      
      await api.post(
        "/employees/",
        employee,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await Promise.all([
  refreshEmployees(),
  refreshDashboard(),
]);


      setOpenModal(false);

    } catch (error) {

      console.error(error);

      alert(
        "Failed to create employee."
      );

    }

  };

  const filteredEmployees =
    employees.filter((employee) => {

      return (

        employee.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        employee.email
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )

      );

    });

  const indexOfLastEmployee =
    currentPage *
    employeesPerPage;

  const indexOfFirstEmployee =
    indexOfLastEmployee -
    employeesPerPage;

  const currentEmployees =
    filteredEmployees.slice(
      indexOfFirstEmployee,
      indexOfLastEmployee
    );

  const totalPages = Math.ceil(
    filteredEmployees.length /
      employeesPerPage
  );

  return (

    <>

      {isAdmin && (
  <AddEmployeeModal
    isOpen={openModal}
    onClose={() => setOpenModal(false)}
    onAddEmployee={createEmployee}
  />
)}  

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-3 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => {

                setSearch(
                  e.target.value
                );

                setCurrentPage(1);

              }}
              className="
                w-64
                pl-9
                pr-3
                py-2
                text-sm
                border
                border-gray-300
                rounded-lg
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

          </div>
        {isAdmin && (
          <button
            onClick={() =>
              setOpenModal(true)
            }
            className="
              px-4
              py-2
              bg-blue-600
              text-white
              rounded-lg
              hover:bg-blue-700
              transition
            "
          >
            + Add Employee
          </button>
        )}

        </div>
                {/* Table */}

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr className="text-sm text-gray-600">

              <th className="py-3 text-center w-16 font-semibold">
                Sl.No.
              </th>

              <th className="py-3 text-left font-semibold">
                Employee Name
              </th>

              <th className="py-3 text-left font-semibold">
                Email
              </th>

              <th className="py-3 text-center w-44 font-semibold">
                Phone
              </th>

              <th className="py-3 text-center w-44 font-semibold">
                Projects
              </th>

              <th className="py-3 text-center w-28 font-semibold">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {currentEmployees.map(
              (employee, index) => (

                <tr
                  key={employee.id}
                  className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200"
                >

                  <td className="py-3 text-center text-sm font-medium text-gray-700">
                    {indexOfFirstEmployee + index + 1}
                  </td>

                  <td className="py-3 font-medium text-gray-800">
                    {employee.name}
                  </td>

                  <td className="py-3 text-gray-700">
                    {employee.email}
                  </td>

                  <td className="py-3 text-center text-gray-700">
                    {employee.phone}
                  </td>

                  <td className="py-3 text-center">
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
  className="
    inline-flex
    items-center
    justify-center
    gap-2
    w-24
    py-2
    rounded-lg
    bg-blue-600
    text-white
    text-sm
    font-medium
    hover:bg-blue-700
    transition
  "
>

  <Eye size={16} />

  View

</button>
                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

        {/* Empty State */}

        {filteredEmployees.length === 0 && (

          <div className="py-10 flex flex-col items-center justify-center text-gray-500">

            <div className="text-5xl mb-3">
              👤
            </div>

            <h3 className="text-lg font-semibold text-gray-700">
              No Employees Found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Try changing your search or add a new employee.
            </p>

          </div>

        )}

        {/* Footer */}

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">

          <p className="text-sm text-gray-500">

            Showing

            <span className="font-semibold text-gray-700 mx-1">
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