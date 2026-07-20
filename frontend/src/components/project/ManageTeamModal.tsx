import { useEffect, useState } from "react";
import api from "../../api/axios";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
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

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [selected, setSelected] =
    useState<number[]>([]);

  useEffect(() => {

    if (isOpen) {

      fetchEmployees();

      fetchMembers();

    }

  }, [isOpen]);

  const fetchEmployees = async () => {

    const token =
      localStorage.getItem("token");

    const response =
      await api.get(
        "/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    setEmployees(response.data);

  };

  const fetchMembers = async () => {

    const token =
      localStorage.getItem("token");

    const response =
      await api.get(
        `/project-employees/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    setSelected(
      response.data.map(
        (item: any) =>
          item.employee_id
      )
    );

  };

  const toggleEmployee = (
    id: number
  ) => {

    if (
      selected.includes(id)
    ) {

      setSelected(
        selected.filter(
          (x) => x !== id
        )
      );

    } else {

      setSelected([
        ...selected,
        id,
      ]);

    }

  };

  const saveMembers = async () => {

  try {

    console.log("Selected before save:", selected);

    const token =
      localStorage.getItem("token");

    const current =
      await api.get(
        `/project-employees/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    console.log(
      "Current members:",
      current.data
    );

    for (const member of current.data) {

      console.log(
        "Removing:",
        member.employee_id
      );

      await api.delete(
        "/project-employees/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            project_id: projectId,
            employee_id:
              member.employee_id,
          },
        }
      );

    }

    for (const id of selected) {

      console.log(
        "Adding:",
        id
      );

      await api.post(
        "/project-employees/",
        {
          project_id: projectId,
          employee_id: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    }

    await onSaved();

fetchMembers();

onClose();

  } catch (error) {

    console.error(
      "SAVE TEAM ERROR:",
      error
    );

  }

};

  if (!isOpen)
    return null;

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[550px] p-6">

        <h2 className="text-2xl font-bold mb-6">
          Manage Team
        </h2>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">

          {employees.map(
            (employee) => (

              <label
                key={employee.id}
                className="flex items-center gap-3 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
              >

                <input
                  type="checkbox"
                  checked={selected.includes(
                    employee.id
                  )}
                  onChange={() =>
                    toggleEmployee(
                      employee.id
                    )
                  }
                />

                <div>

                  <p className="font-medium">
                    {
                      employee.name
                    }
                  </p>

                  <p className="text-sm text-gray-500">
                    {
                      employee.email
                    }
                  </p>

                </div>

              </label>

            )
          )}

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={
              saveMembers
            }
            className="px-5 py-2 bg-blue-600 text-white rounded-lg"
          >
            Save Team
          </button>

        </div>

      </div>

    </div>

  );

};

export default ManageTeamModal;