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

        <div className="grid grid-cols-3 gap-4">

          {members.map(
            (member) => (

              <div
                key={member.id}
                className="border rounded-xl p-4 hover:bg-blue-50 transition"
              >

                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl mb-3">
                  👤
                </div>

                <h3 className="font-semibold">
                  {member.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {member.email}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {member.phone}
                </p>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );

};

export default TeamMembers;