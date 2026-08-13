import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "MANAGER" | "TEAM_MEMBER";
  }) => Promise<void>;
};

const AddEmployeeModal = ({
  isOpen,
  onClose,
  onAddEmployee,
}: Props) => {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isAdmin = user.role === "ADMIN";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<
    "MANAGER" | "TEAM_MEMBER" | ""
  >("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[500px] p-6">

        <h2 className="text-2xl font-bold mb-6">
          {isAdmin ? "Create User" : "Add Employee"}
        </h2>

        <div className="space-y-4">

          {/* Name */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Name
            </label>

            <input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Company Email */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Company Email
            </label>

            <input
              placeholder="john.doe@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Phone Number
            </label>

            <input
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Temporary Password */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Temporary Password
            </label>

            <input
              type="password"
              placeholder="Enter temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Role */}
          {isAdmin && (
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Role
              </label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value as
                      | "MANAGER"
                      | "TEAM_MEMBER"
                  )
                }
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="" disabled>
                  Select role
                </option>

                <option value="TEAM_MEMBER">
                  Team Member
                </option>

                <option value="MANAGER">
                  Manager
                </option>
              </select>
            </div>
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
            onClick={async () => {
              if (password.length < 12) {
                alert(
                  "Password must be at least 12 characters."
                );
                return;
              }

              if (isAdmin && !role) {
                alert("Please select a role.");
                return;
              }

              await onAddEmployee({
                name,
                email,
                phone,
                password,
                role: role as "MANAGER" | "TEAM_MEMBER",
              });
            }}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg"
          >
            Save
          </button>

        </div>

      </div>
    </div>
  );
};

export default AddEmployeeModal;