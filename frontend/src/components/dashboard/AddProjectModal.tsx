import { useEffect, useState } from "react";
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
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8">
        <h2 className="text-2xl font-bold mb-8">
          Add New Project
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
                rows={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Side */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Members
            </label>

            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search employees by name..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-2 border border-gray-200 rounded-lg max-h-[310px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">
                  No employees found.
                </p>
              ) : (
                filteredEmployees.map((employee) => {
                  const selected = selectedEmployeeIds.includes(employee.id);

                  return (
                    <button
                      type="button"
                      key={employee.id}
                      onClick={() => toggleEmployee(employee.id)}
                      className={`w-full text-left px-4 py-4 border-b last:border-b-0 transition ${
                        selected
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {employee.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {employee.email}
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {selected && "✓"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {selectedEmployeeIds.length > 0 && (
              <p className="text-sm text-blue-600 mt-3">
                {selectedEmployeeIds.length} team member
                {selectedEmployeeIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;