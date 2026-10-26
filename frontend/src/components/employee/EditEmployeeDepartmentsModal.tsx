import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import api from "../../api/axios";
import { apiErrorMessage } from "../../utils/apiErrorMessage";

type Department = {
  id: number;
  name: string;
  is_active: boolean;
};

type Props = {
  isOpen: boolean;
  employeeId: number;
  employeeName: string;
  currentDepartmentNames: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const EditEmployeeDepartmentsModal = ({
  isOpen,
  employeeId,
  employeeName,
  currentDepartmentNames,
  onClose,
  onSaved,
}: Props) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadDepartments = async () => {
      setLoading(true);

      try {
        const response = await api.get<Department[]>("/departments");
        const activeDepartments = response.data.filter(
          (department) => department.is_active
        );

        setDepartments(activeDepartments);

        const currentNames = new Set(currentDepartmentNames);

        setSelectedIds(
          activeDepartments
            .filter((department) => currentNames.has(department.name))
            .map((department) => department.id)
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          alert(apiErrorMessage(error.response?.data?.detail));
        } else {
          alert("Failed to load departments.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadDepartments();
  }, [isOpen, employeeId, currentDepartmentNames]);

  if (!isOpen) return null;

  const toggleDepartment = (departmentId: number) => {
    setSelectedIds((previous) =>
      previous.includes(departmentId)
        ? previous.filter((id) => id !== departmentId)
        : [...previous, departmentId]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      await api.put(
        `/employees/${employeeId}/departments`,
        { department_ids: selectedIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await onSaved();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(apiErrorMessage(error.response?.data?.detail));
      } else {
        alert("Failed to update employee departments.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Edit Departments
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select departments for {employeeName}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading departments...
            </p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No active departments are available.
            </p>
          ) : (
            departments.map((department) => (
              <label
                key={department.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(department.id)}
                  onChange={() => toggleDepartment(department.id)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span className="text-sm font-medium text-slate-700">
                  {department.name}
                </span>
              </label>
            ))
          )}

          <p className="text-xs text-slate-500">
            Select multiple departments. Unchecked departments will be removed
            when you save.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Departments"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeDepartmentsModal;