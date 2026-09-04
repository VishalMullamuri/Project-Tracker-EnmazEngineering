import { useState } from "react";
import { UserPlus, X } from "lucide-react";

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

const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400";

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}

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
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>

        </div>

        {/* Body */}

        <div className="px-7 py-6 overflow-y-auto flex-1 space-y-5">

          <div>
            <label className={labelClass}>Name</label>

            <input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Company Email</label>

            <input
              placeholder="john.doe@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>

            <input
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Temporary Password</label>

            <input
              type="password"
              placeholder="Enter temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>

          {isAdmin && (
            <div>
              <label className={labelClass}>Role</label>

              <select
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value as "MANAGER" | "TEAM_MEMBER"
                  )
                }
                className={inputClass}
              >
                <option value="" disabled>
                  Select role
                </option>

                <option value="TEAM_MEMBER">Team Member</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          )}

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 px-7 py-5 border-t border-slate-200 bg-slate-50 shrink-0">

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              if (password.length < 12) {
                alert("Password must be at least 12 characters.");
                return;
              }

              if (isAdmin && !role) {
                alert("Please select a role.");
                return;
              }

              try {
                await onAddEmployee({
                  name,
                  email,
                  phone,
                  password,
                  role: role as "MANAGER" | "TEAM_MEMBER",
                });
              } catch {
                return;
              }

              setName("");
              setEmail("");
              setPhone("");
              setPassword("");
              setRole("");
            }}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            Save
          </button>

        </div>

      </div>
    </div>
  );
};

export default AddEmployeeModal;
