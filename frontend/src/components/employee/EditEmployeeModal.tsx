import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

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

const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2";

const inputClass =
  "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow placeholder:text-slate-400";

const EditEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onUpdateEmployee,
}: Props) => {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {

    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setPhone(employee.phone);
    }

  }, [employee]);

  if (!isOpen) return null;

  return (

    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between px-7 py-6 border-b border-slate-200 shrink-0">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Pencil size={18} strokeWidth={1.75} className="text-blue-600" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Edit Employee
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
            <label className={labelClass}>Employee Name</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Employee Name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Company Email</label>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Company Email"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className={inputClass}
            />
          </div>

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
              await onUpdateEmployee({
                name,
                email,
                phone,
              });
            }}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>

  );

};

export default EditEmployeeModal;
