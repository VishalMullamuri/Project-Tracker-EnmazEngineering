import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">
          Team Members
        </h2>

        <span className="text-xs text-slate-400">
          {members.length} member{members.length === 1 ? "" : "s"}
        </span>
      </div>

      {showAddMembers && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Add Team Members
              </h3>

              <p className="text-xs text-slate-500 mt-0.5">
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
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members by name or email..."
              className="w-full border border-slate-300 rounded-lg bg-white px-4 py-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    {search
                      ? "No team members found"
                      : "No available team members"}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
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
                      className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-slate-100 last:border-b-0 transition-colors ${
                        selected ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getAvatarColor(
                            employee.name
                          )}`}
                        >
                          {getInitials(employee.name)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {employee.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-[10px] transition-colors ${
                          selected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 bg-white"
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
            <p className="text-xs text-slate-500">
              {selectedEmployeeIds.length > 0
                ? `${selectedEmployeeIds.length} selected`
                : "Select team members"}
            </p>

            <button
              type="button"
              onClick={addTeamMembers}
              disabled={adding || selectedEmployeeIds.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? "Adding..." : "Add Selected"}
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[280px] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {members.map((member) => (
            <div
              key={member.id}
              className="min-h-[168px] rounded-xl border border-slate-200 bg-white hover:border-blue-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all flex flex-col items-center justify-center text-center px-4 py-5"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold mb-3 ${getAvatarColor(
                  member.name
                )}`}
              >
                {getInitials(member.name)}
              </div>

              <h3 className="text-sm font-semibold text-slate-800">
                {member.name}
              </h3>

              <p className="text-xs text-slate-500 break-all mt-1">
                {member.email}
              </p>

              <p className="text-xs text-slate-500 mt-0.5">
                {member.phone}
              </p>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowAddMembers(true)}
            className="min-h-[168px] rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center text-center px-4 py-5 group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
              <Plus size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <p className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
              Add Member
            </p>
          </button>

        </div>

        {members.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-2">
            No team members assigned yet.
          </p>
        )}
      </div>

    </div>
  );
};

export default TeamMembers;
