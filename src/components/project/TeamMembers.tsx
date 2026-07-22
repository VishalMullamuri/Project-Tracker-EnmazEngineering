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

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

      <h2 className="text-xl font-semibold mb-5">
        Team Members
      </h2>

      {members.length === 0 ? (

        <div className="text-center py-8 text-gray-500">

          No team members assigned.

        </div>

      ) : (

        <div className="max-h-[120px] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 gap-3">

          {members.map(
            (member) => (

              <div
                key={member.id}
                className="border rounded-lg p-3 hover:bg-blue-50 transition min-h-[110px]"
              >

                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-base mb-2">
                  👤
                </div>

                <h3 className="font-semibold text-sm leading-tight truncate">
                  {member.name}
                </h3>

                <p className="text-[11px] text-gray-500 truncate">
                  {member.email}
                </p>

                <p className="text-[11px] text-gray-500 truncate">
                  {member.phone}
                </p>

              </div>

            )
          )}

        </div>

        </div>

      )}

    </div>

  );

};

export default TeamMembers;