import { useEffect, useState } from "react";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
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
};

const EditEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onUpdateEmployee,
}: Props) => {

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  useEffect(() => {

    if (employee) {

      setName(employee.name);

      setEmail(employee.email);

      setPhone(employee.phone);

    }

  }, [employee]);

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl w-[500px] p-6">

        <h2 className="text-2xl font-bold mb-6">
          Edit Employee
        </h2>

        <div className="space-y-4">

          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Employee Name"
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="Company Email"
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="Phone Number"
            className="w-full border rounded-lg px-4 py-3"
          />
                  </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="
              px-5
              py-2
              border
              rounded-lg
              hover:bg-gray-100
              transition
            "
          >
            Cancel
          </button>

          <button
            onClick={async () => {

              await onUpdateEmployee({
                name,
                email,
                phone,
              });

            }}
            className="
              px-5
              py-2
              bg-blue-600
              text-white
              rounded-lg
              hover:bg-blue-700
              transition
            "
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>

  );

};

export default EditEmployeeModal;