import { useEffect, useState } from "react";
import api from "../../api/axios";
import Pagination from "./Pagination";

type Task = {
  id: number;
  project_id: number;
  project_name: string;
  assigned_to: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  remarks: string | null;
  start_date: string;
  due_date: string;
  created_by: number;
};

type ConsolidatedTaskTableProps = {
  search: string;
  tab: string;
};

const ConsolidatedTaskTable = ({
  search,
  tab,
}: ConsolidatedTaskTableProps) => {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] =
  useState(() => {
    return Number(
      sessionStorage.getItem("taskPage")
    ) || 1;
  });
  const tasksPerPage = 5;

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {

  sessionStorage.setItem(
    "taskPage",
    currentPage.toString()
  );

}, [currentPage]);



  const fetchTasks = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get("/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      const sortedTasks =
        [...response.data].sort((a, b) =>
          a.project_name.localeCompare(
            b.project_name
          )
        );

      setTasks(sortedTasks);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  const updateTaskStatus = async (
    task: Task,
    newStatus: string
  ) => {

    try {

      const token =
        localStorage.getItem("token");

      const role = JSON.parse(
  localStorage.getItem("user") || "{}"
).role;

const payload =
  role === "TEAM_MEMBER"
    ? {
        status: newStatus,
        remarks: task.remarks,
      }
    : {
        assigned_to: task.assigned_to,
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        remarks: task.remarks,
        start_date: task.start_date,
        due_date: task.due_date,
      };

await api.put(
  `/tasks/${task.id}`,
  payload,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      sessionStorage.setItem(
        "showConsolidated",
        "true"
      );

      sessionStorage.setItem(
  "taskPage",
  currentPage.toString()
);

window.location.reload();

    } catch (error) {

      console.error(error);

      alert("Failed to update task status.");

    }

  };

  const filteredTasks =
    tasks.filter((task) => {

      const matchesSearch =

        task.project_name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        task.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      if (tab === "All") {
        return matchesSearch;
      }

      if (tab === "Open") {

        return (
          task.status !== "Completed" &&
          matchesSearch
        );

      }

      if (tab === "Closed") {

        return (
          task.status === "Completed" &&
          matchesSearch
        );

      }

      return matchesSearch;

    });

  const indexOfLastTask =
    currentPage * tasksPerPage;

  const indexOfFirstTask =
    indexOfLastTask - tasksPerPage;

  const currentTasks =
    filteredTasks.slice(
      indexOfFirstTask,
      indexOfLastTask
    );

  const totalPages =
    Math.ceil(
      filteredTasks.length /
      tasksPerPage
    );

  if (loading) {

    return (

      <div className="py-10 text-center text-gray-500">
        Loading...
      </div>

    );

  }

  if (filteredTasks.length === 0) {

    return (

      <div className="py-10 flex flex-col items-center justify-center text-gray-500">

        <div className="text-5xl mb-3">
          📋
        </div>

        <h3 className="text-lg font-semibold text-gray-700">
          No Tasks Found
        </h3>

        <p className="text-sm mt-1">
          No tasks match your search.
        </p>

      </div>

    );

  }

  return (

  <>

    <table className="w-full">

      <thead className="bg-gray-50">

        <tr className="text-sm text-gray-600">

          <th className="py-3 text-center w-16 font-semibold">
            Sl.No.
          </th>

          <th className="py-3 text-left font-semibold w-[36%]">
            Project Name
          </th>

          <th className="py-3 text-left font-semibold">
            Task
          </th>

          <th className="py-3 text-center w-48 font-semibold">
            Priority
          </th>

          <th className="py-3 text-center w-48 font-semibold">
            Status
          </th>

          <th className="py-3 text-center w-44 font-semibold">
            Due Date
          </th>

          <th className="py-3 text-left font-semibold">
            Remarks
          </th>

        </tr>

      </thead>

      <tbody>

        {currentTasks.map((task, index) => (

          <tr
            key={task.id}
            className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200"
          >

            <td className="py-3 text-center text-sm font-medium text-gray-700">
              {indexOfFirstTask + index + 1}
            </td>

            <td className="py-3 font-medium text-gray-800 w-[36%]">
              {task.project_name}
            </td>

            <td className="py-3 text-gray-700">
              {task.title}
            </td>

            <td className="py-3 text-center text-sm text-gray-700">
              {task.priority}
            </td>

            <td className="py-3 text-center">

              <select
                value={task.status}
                onChange={(e) =>
                  updateTaskStatus(
                    task,
                    e.target.value
                  )
                }
                className="
                  border
                  border-gray-300
                  rounded-lg
                  px-3
                  py-1.5
                  text-sm
                  bg-white
                  outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              >

                <option value="Not Started">
                  Not Started
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Completed">
                  Completed
                </option>

              </select>

            </td>

            <td className="py-3 text-center text-sm text-gray-600">
              {task.due_date}
            </td>

            <td className="py-3 text-gray-600">
              {task.remarks?.trim()
                ? task.remarks
                : "-"}
            </td>

          </tr>

        ))}

      </tbody>

    </table>
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">

      <p className="text-sm text-gray-500">

        Showing

        <span className="font-semibold text-gray-700 mx-1">
          {filteredTasks.length}
        </span>

        task(s)

      </p>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

    </div>

  </>

);

};

export default ConsolidatedTaskTable;