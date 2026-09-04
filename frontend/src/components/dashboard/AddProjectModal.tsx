import { useEffect, useState } from "react";
import { FolderPlus, Search, X, Check } from "lucide-react";
import api from "../../api/axios";

export type CreateProject = {
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  employee_ids: number[];
};

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: CreateProject) => Promise<void>;
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

const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400";

const AddProjectModal = ({
  isOpen,
  onClose,
  onAddProject,
}: Props) => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await api.get("/employees", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setEmployees(
          response.data.filter(
            (employee: Employee) => employee.role === "TEAM_MEMBER"
          )
        );
      } catch (error) {
        console.error(error);
      }
    };

    fetchEmployees();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter((employee) =>
    employee.name
      .toLowerCase()
      .includes(employeeSearch.toLowerCase())
  );

  const toggleEmployee = (employeeId: number) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    );
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      alert("Project Name is required");
      return;
    }

    if (!description.trim()) {
      alert("Description is required");
      return;
    }

    if (!startDate) {
      alert("Please select a Start Date");
      return;
    }

    if (!endDate) {
      alert("Please select an End Date");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("End Date cannot be before Start Date");
      return;
    }

    await onAddProject({
      project_name: projectName,
      description,
      start_date: startDate,
      end_date: endDate,
      employee_ids: selectedEmployeeIds,
    });

    setProjectName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setEmployeeSearch("");
    setSelectedEmployeeIds([]);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 shrink-0">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FolderPlus size={20} strokeWidth={1.75} className="text-blue-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Add New Project
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the details to create a new project
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>

        </div>

        {/* Body */}

        <div className="px-8 py-6 overflow-y-auto flex-1">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left Side */}

            <div className="space-y-5">

              <div>
                <label className={labelClass}>Project Name</label>

                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={inputClass}
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Enter project description"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date</label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>End Date</label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

            </div>

            {/* Right Side */}

            <div>

              <div className="flex items-center justify-between mb-2">
                <label className={`${labelClass} mb-0`}>Team Members</label>

                {selectedEmployeeIds.length > 0 && (
                  <span className="text-xs font-semibold text-blue-600">
                    {selectedEmployeeIds.length} selected
                  </span>
                )}
              </div>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search employees by name..."
                  className={`${inputClass} pl-10`}
                />
              </div>

              <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-500">
                      No employees found.
                    </p>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const selected = selectedEmployeeIds.includes(
                        employee.id
                      );

                      return (
                        <button
                          type="button"
                          key={employee.id}
                          onClick={() => toggleEmployee(employee.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-slate-100 last:border-b-0 transition-colors ${
                            selected ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getAvatarColor(
                                employee.name
                              )}`}
                            >
                              {getInitials(employee.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {employee.name}
                              </p>

                              <p className="text-xs text-slate-500 truncate">
                                {employee.email}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-200 bg-slate-50 shrink-0">

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            Save Project
          </button>

        </div>

      </div>
    </div>
  );
};

export default AddProjectModal;
