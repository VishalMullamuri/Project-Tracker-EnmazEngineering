import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import axios from "axios";
import api from "../../api/axios";
import { apiErrorMessage } from "../../utils/apiErrorMessage";

type Department = {
  id: number;
  name: string;
  is_active: boolean;
};

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  department_names?: string[];
  department_ids?: number[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onUpdateEmployee: (employee: {
    name: string;
    email: string;
    phone: string;
  }) => Promise<void>;
  onDepartmentsUpdated?: () => Promise<void>;
};

const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400";

const EditEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onUpdateEmployee,
  onDepartmentsUpdated,
}: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>(
    []
  );

  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    if (!employee) return;

    setName(employee.name ?? "");
    setEmail(employee.email ?? "");
    setPhone(employee.phone ?? "");
  }, [employee]);

  useEffect(() => {
    if (!isOpen || !isAdmin || !employee) return;

    let cancelled = false;

    const loadDepartments = async () => {
      setLoadingDepartments(true);

      try {
        const [departmentResponse, employeeResponse] = await Promise.all([
          api.get<Department[]>("/departments"),
          api.get(`/employees/${employee.id}`),
        ]);

        if (cancelled) return;

        const activeDepartments = departmentResponse.data.filter(
          (department) => department.is_active
        );

        setDepartments(activeDepartments);

        const employeeData = employeeResponse.data as Employee;

        // Prefer department IDs when the API provides them.
        if (employeeData.department_ids) {
          setSelectedDepartmentIds(employeeData.department_ids);
        } else {
          const departmentNames = new Set(
            employeeData.department_names ?? employee.department_names ?? []
          );

          setSelectedDepartmentIds(
            activeDepartments
              .filter((department) => departmentNames.has(department.name))
              .map((department) => department.id)
          );
        }
      } catch (error) {
        if (!cancelled) {
          if (axios.isAxiosError(error)) {
            alert(apiErrorMessage(error.response?.data?.detail));
          } else {
            alert("Failed to load departments.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingDepartments(false);
        }
      }
    };

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [isOpen, isAdmin, employee]);

  if (!isOpen) return null;

  const toggleDepartment = (departmentId: number) => {
    setSelectedDepartmentIds((previous) =>
      previous.includes(departmentId)
        ? previous.filter((id) => id !== departmentId)
        : [...previous, departmentId]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      alert("Employee name and email are required.");
      return;
    }

    setSaving(true);

    try {
      // Save the employee's basic information.
      await onUpdateEmployee({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      // Only admins can update department assignments.
      if (isAdmin) {
        await api.put(`/employees/${employee.id}/departments`, {
          department_ids: selectedDepartmentIds,
        });

        if (onDepartmentsUpdated) {
          await onDepartmentsUpdated();
        }
      }

      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(apiErrorMessage(error.response?.data?.detail));
      } else {
        alert("Failed to save employee changes.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-7 py-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Pencil
                size={18}
                strokeWidth={1.75}
                className="text-blue-600"
              />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Edit Employee
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-7 py-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className={labelClass}>Employee Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Employee Name"
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Company Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Company Email"
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              disabled={saving}
              className={inputClass}
            />
          </div>

          {isAdmin && (
            <div>
              <label className={labelClass}>Departments</label>

              {loadingDepartments ? (
                <p className="text-sm text-slate-500">
                  Loading departments...
                </p>
              ) : departments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No active departments available.
                </p>
              ) : (
                <div className="space-y-2">
                  {departments.map((department) => (
                    <label
                      key={department.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartmentIds.includes(department.id)}
                        onChange={() => toggleDepartment(department.id)}
                        disabled={saving}
                        className="h-4 w-4 rounded border-slate-300"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {department.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Select all departments that apply. Unchecked departments will
                be removed when you save.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-7 py-5 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (isAdmin && loadingDepartments)}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
