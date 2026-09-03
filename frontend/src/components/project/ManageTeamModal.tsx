import { useEffect, useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import api from "../../api/axios";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role?: string;
};

type Props = {
  isOpen: boolean;
  projectId: number;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const ManageTeamModal = ({
  isOpen,
  projectId,
  onClose,
  onSaved,
}: Props) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setSearch("");
    fetchEmployees();
    fetchMembers();
  }, [isOpen, projectId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await api.get("/employees/assignable", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees(
        response.data.filter(
          (employee: Employee) =>
            !employee.role ||
            employee.role === "TEAM_MEMBER"
        )
      );
    } catch (error) {
      console.error("FETCH EMPLOYEES ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/project-employees/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelected(
        response.data.map(
          (item: { employee_id: number }) =>
            item.employee_id
        )
      );
    } catch (error) {
      console.error("FETCH MEMBERS ERROR:", error);
    }
  };

  const filteredEmployees = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return employees;
    }

    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(value) ||
        employee.email.toLowerCase().includes(value)
    );
  }, [employees, search]);

  const toggleEmployee = (id: number) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((employeeId) => employeeId !== id)
        : [...current, id]
    );
  };

  const saveMembers = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const current = await api.get(
        `/project-employees/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const currentIds: number[] = current.data.map(
        (member: { employee_id: number }) =>
          member.employee_id
      );

      const toRemove = currentIds.filter(
        (id) => !selected.includes(id)
      );

      const toAdd = selected.filter(
        (id) => !currentIds.includes(id)
      );

      await Promise.all(
        toRemove.map((employee_id) =>
          api.delete("/project-employees", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: {
              project_id: projectId,
              employee_id,
            },
          })
        )
      );

      await Promise.all(
        toAdd.map((employee_id) =>
          api.post(
            "/project-employees",
            {
              project_id: projectId,
              employee_id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      await onSaved();

      await fetchMembers();

      onClose();
    } catch (error) {
      console.error("SAVE TEAM ERROR:", error);
      alert("Failed to update team members.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Manage Team
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Search and select team members for this project.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search + Members */}
        <div className="px-7 py-5">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-12 border border-gray-300 rounded-xl bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center justify-between mt-4 mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Team Members
            </p>

            <span className="text-sm text-blue-600 font-medium">
              {selected.length} selected
            </span>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-[330px] overflow-y-auto">
              {loading ? (
                <div className="h-48 flex items-center justify-center text-sm text-gray-500">
                  Loading team members...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Users
                      size={22}
                      className="text-gray-400"
                    />
                  </div>

                  <p className="font-medium text-gray-700">
                    {search
                      ? "No team members found"
                      : "No team members available"}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {search
                      ? "Try searching with another name or email."
                      : "There are no assignable team members."}
                  </p>
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const isSelected = selected.includes(
                    employee.id
                  );

                  return (
                    <button
                      type="button"
                      key={employee.id}
                      onClick={() =>
                        toggleEmployee(employee.id)
                      }
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-left border-b last:border-b-0 transition ${
                        isSelected
                          ? "bg-blue-50"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            isSelected
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
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
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <span className="text-sm font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selected.length === 0
              ? "No members selected"
              : `${selected.length} member${
                  selected.length !== 1 ? "s" : ""
                } selected`}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveMembers}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Team"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTeamModal;