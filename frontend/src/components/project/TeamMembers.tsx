import { useEffect, useState } from "react";
import api from "../../api/axios";

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

type Props = {
  projectId: number;
};

const TeamMembers = ({
  projectId,
}: Props) => {
  const [members, setMembers] =
    useState<Employee[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
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

      const allEmployees =
        await api.get(
          "/employees",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const employeeMap =
        new Map(
          allEmployees.data.map(
            (employee: Employee) => [
              employee.id,
              employee,
            ]
          )
        );

      const assigned =
        response.data
          .map(
            (member: any) =>
              employeeMap.get(
                member.employee_id
              )
          )
          .filter(Boolean);

      setMembers(
        assigned as Employee[]
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">
        Team Members
      </h2>

      {members.length === 0 ? (
        <div className="flex items-center justify-center h-52 text-gray-500">
          No team members assigned.
        </div>
      ) : (
        <div className="max-h-[250px] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="
                  h-40
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  hover:bg-blue-50
                  transition
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  px-4
                "
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-3">
                  👤
                </div>

                <h3 className="font-semibold text-gray-800 text-lg">
                  {member.name}
                </h3>

                <p className="text-sm text-gray-500 break-all mt-1">
                  {member.email}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {member.phone}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;