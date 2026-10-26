import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";
import axios from "axios";
import api from "../../api/axios";
import { apiErrorMessage } from "../../utils/apiErrorMessage";

type Department = {
  id: number;
  name: string;
  is_active: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "MANAGER" | "TEAM_MEMBER";
    department_ids: number[];
  }) => Promise<void>;
};

const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400";

const AddEmployeeModal = ({ isOpen, onClose, onAddEmployee }: Props) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "ADMIN";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MANAGER" | "TEAM_MEMBER" | "">("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState("");

  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    let cancelled = false;
    async function loadDepartments() {
      setDepartmentsLoading(true);
      setDepartmentError("");
      try {
        const response = await api.get<Department[]>("/departments");
        if (!cancelled) {
          setDepartments(response.data.filter((department) => department.is_active));
        }
      } catch (error) {
        if (!cancelled) {
          if (axios.isAxiosError(error)) {
            setDepartmentError(apiErrorMessage(error.response?.data?.detail));
          } else {
            setDepartmentError("Could not load departments.");
          }
        }
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    }

    void loadDepartments();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("");
    setDepartmentIds([]);
    setDepartmentError("");
  };

  const toggleDepartment = (departmentId: number) => {
    setDepartmentIds((current) =>
      current.includes(departmentId)
        ? current.filter((id) => id !== departmentId)
        : [...current, departmentId],
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-7 py-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <UserPlus size={20} strokeWidth={1.75} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {isAdmin ? "Create User" : "Add Employee"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className={labelClass} htmlFor="employee-name">Name</label>
            <input
              id="employee-name"
              required
              placeholder="John Doe"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="employee-email">Company Email</label>
            <input
              id="employee-email"
              type="email"
              required
              placeholder="john.doe@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="employee-phone">Phone Number</label>
            <input
              id="employee-phone"
              required
              placeholder="9876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="employee-password">Temporary Password</label>
            <input
              id="employee-password"
              type="password"
              required
              minLength={12}
              maxLength={72}
              placeholder="Enter temporary password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">At least 12 characters.</p>
          </div>

          {isAdmin && (
            <>
              <div>
                <label className={labelClass} htmlFor="employee-role">Role</label>
                <select
                  id="employee-role"
                  required
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as "MANAGER" | "TEAM_MEMBER" | "")
                  }
                  className={inputClass}
                >
                  <option value="" disabled>Select role</option>
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              <div>
                <p className={labelClass}>Departments</p>
                <p className="mb-2 text-xs text-slate-500">
                  Select one or more departments for this employee.
                </p>

                {departmentsLoading && (
                  <p className="text-sm text-slate-500">Loading departments...</p>
                )}

                {departmentError && (
                  <p role="alert" className="mb-2 text-sm text-red-600">
                    {departmentError}
                  </p>
                )}

                {!departmentsLoading && departments.length === 0 && !departmentError && (
                  <p className="text-sm text-slate-500">No active departments available.</p>
                )}

                {departments.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                    {departments.map((department) => (
                      <label
                        key={department.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={departmentIds.includes(department.id)}
                          onChange={() => toggleDepartment(department.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        {department.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-7 py-5 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={departmentsLoading || (isAdmin && departments.length === 0)}
            onClick={async () => {
              if (!name.trim() || !email.trim() || !phone.trim()) {
                alert("Please fill in name, email, and phone number.");
                return;
              }
              if (password.length < 12) {
                alert("Password must be at least 12 characters.");
                return;
              }
              if (isAdmin && !role) {
                alert("Please select a role.");
                return;
              }
              if (isAdmin && departmentIds.length === 0) {
                alert("Please select at least one department.");
                return;
              }

              try {
                await onAddEmployee({
                  name: name.trim(),
                  email: email.trim(),
                  phone: phone.trim(),
                  password,
                  role: (isAdmin ? role : "TEAM_MEMBER") as "MANAGER" | "TEAM_MEMBER",
                  department_ids: isAdmin ? departmentIds : [],
                });
              } catch {
                return;
              }

              resetForm();
            }}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
