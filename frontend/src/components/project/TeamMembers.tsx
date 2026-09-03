import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role?: string;
};

type Props = {
  projectId: number;
};

const TeamMembers = ({ projectId }: Props) => {
  const [members, setMembers] = useState<Employee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
    []
  );
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [assignmentsResponse, employeesResponse] = await Promise.all([
        api.get(`/project-employees/${projectId}`, {
          headers,
        }),
        api.get("/employees", {
          headers,
        }),
      ]);

      const employeeList: Employee[] = employeesResponse.data.filter(
        (employee: Employee) =>
          !employee.role || employee.role === "TEAM_MEMBER"
      );

      const employeeMap = new Map(
        employeeList.map((employee) => [employee.id, employee])
      );

      const assigned = assignmentsResponse.data
        .map((assignment: { employee_id: number }) =>
          employeeMap.get(assignment.employee_id)
        )
        .filter(Boolean) as Employee[];

      setEmployees(employeeList);
      setMembers(assigned);
    } catch (error) {
      console.error(error);
    }
  };

  const assignedEmployeeIds = useMemo(
    () => new Set(members.map((member) => member.id)),
    [members]
  );

  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return employees.filter((employee) => {
      if (assignedEmployeeIds.has(employee.id)) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return (
        employee.name.toLowerCase().includes(searchValue) ||
        employee.email.toLowerCase().includes(searchValue)
      );
    });
  }, [employees, assignedEmployeeIds, search]);

  const toggleEmployee = (employeeId: number) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    );
  };

  const addTeamMembers = async () => {
    if (selectedEmployeeIds.length === 0) {
      return;
    }

    try {
      setAdding(true);

      const token = localStorage.getItem("token");

      await Promise.all(
        selectedEmployeeIds.map((employeeId) =>
          api.post(
            "/project-employees",
            {
              project_id: projectId,
              employee_id: employeeId,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      setSelectedEmployeeIds([]);
      setSearch("");
      setShowAddMembers(false);

      await fetchMembers();
    } catch (error) {
      console.error(error);
      alert("Failed to add team members.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">
        Team Members
      </h2>

      {showAddMembers && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Add Team Members
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Search and select team members to assign to this project.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddMembers(false);
                setSearch("");
                setSelectedEmployeeIds([]);
              }}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members by name or email..."
              className="w-full border border-gray-300 rounded-lg bg-white px-4 py-3 pl-11 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">👥</div>

                  <p className="font-medium text-gray-700">
                    {search
                      ? "No team members found"
                      : "No available team members"}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {search
                      ? "Try a different name or email."
                      : "All team members are already assigned."}
                  </p>
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const selected = selectedEmployeeIds.includes(employee.id);

                  return (
                    <button
                      type="button"
                      key={employee.id}
                      onClick={() => toggleEmployee(employee.id)}
                      className={`w-full flex items-center justify-between px-4 py-4 text-left border-b last:border-b-0 transition ${
                        selected
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          👤
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">
                            {employee.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                          selected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selected && "✓"}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              {selectedEmployeeIds.length > 0
                ? `${selectedEmployeeIds.length} selected`
                : "Select team members"}
            </p>

            <button
              type="button"
              onClick={addTeamMembers}
              disabled={
                adding || selectedEmployeeIds.length === 0
              }
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "Adding..." : "Add Selected"}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="flex items-center justify-center h-52 text-gray-500">
          No team members assigned.
        </div>
      ) : (
        <div className="max-h-[250px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="
                  min-h-40
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  hover:bg-blue-50
                  transition
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  px-4
                  py-5
                "
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-3">
                  👤
                </div>

                <h3 className="font-semibold text-gray-800 text-lg">
                  {member.name}
                </h3>

                <p className="text-sm text-gray-500 break-all mt-1">
                  {member.email}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {member.phone}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;