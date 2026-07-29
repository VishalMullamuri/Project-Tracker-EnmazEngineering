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
    "MANAGER" | "TEAM_MEMBER"
  >("TEAM_MEMBER");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[500px] p-6">

        <h2 className="text-2xl font-bold mb-6">
          {isAdmin ? "Create User" : "Add Employee"}
        </h2>

        <div className="space-y-4">

          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            placeholder="Company Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="password"
            placeholder="Temporary Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full border rounded-lg px-4 py-3"
          />

          {isAdmin && (
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
              <option value="TEAM_MEMBER">
                Team Member
              </option>
              <option value="MANAGER">
                Manager
              </option>
            </select>
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
  alert("Password must be at least 12 characters.");
  return;
}
              await onAddEmployee({
                name,
                email,
                phone,
                password,
                role,
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