import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import api from "../../api/axios";
import StatusBadge from "../dashboard/StatusBadge";
import Pagination from "../dashboard/Pagination";

type Task = {
  id: number;
  project_id: number;
  project_name: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  remarks: string;
  due_date: string;
};

const MyWorkTable = () => {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const tasksPerPage = 5;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response = await api.get(
        "/tasks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTasks(response.data);

    } catch (error) {
      console.error(error);
    }
  };

  const filteredTasks =
    tasks.filter((task) => {

      const matchesSearch =
        task.project_name
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        task.title
          .toLowerCase()
          .includes(search.toLowerCase());

      if (tab === "All")
        return matchesSearch;

      if (tab === "Open")
        return (
          task.status !== "Completed" &&
          matchesSearch
        );

      return (
        task.status === "Completed" &&
        matchesSearch
      );

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

  const totalPages = Math.ceil(
    filteredTasks.length /
      tasksPerPage
  );

  return (

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-8 overflow-hidden">

      {/* Header */}

      <div className="flex items-center justify-between px-5 py-4 border-b">

        <div className="relative">

          <Search
            size={16}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e)=>
              setSearch(e.target.value)
            }
            className="w-72 pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        <div className="flex rounded-lg border overflow-hidden">

          <button
            onClick={()=>setTab("All")}
            className={`px-4 py-2 ${
              tab==="All"
              ? "bg-blue-600 text-white"
              : ""
            }`}
          >
            All
          </button>

          <button
            onClick={()=>setTab("Open")}
            className={`px-4 py-2 ${
              tab==="Open"
              ? "bg-blue-600 text-white"
              : ""
            }`}
          >
            Open
          </button>

          <button
            onClick={()=>setTab("Closed")}
            className={`px-4 py-2 ${
              tab==="Closed"
              ? "bg-blue-600 text-white"
              : ""
            }`}
          >
            Closed
          </button>

        </div>

      </div>

      {/* Table */}

      <table className="w-full">

        <thead className="bg-gray-50">

          <tr className="text-gray-600">

            <th className="py-3 text-center">
              Sl.No
            </th>

            <th className="text-left">
              Project
            </th>

            <th className="text-left">
              Task
            </th>

            <th className="text-center">
              Priority
            </th>

            <th className="text-center">
              Status
            </th>

            <th className="text-center">
              Due Date
            </th>

            <th className="text-left">
              Remarks
            </th>

          </tr>

        </thead>

        <tbody>

          {currentTasks.map((task,index)=>(

            <tr
              key={task.id}
              className="border-b hover:bg-blue-50"
            >

              <td className="text-center py-3">
                {indexOfFirstTask+index+1}
              </td>

              <td className="font-medium">
                {task.project_name}
              </td>

              <td>
                {task.title}
              </td>

              <td className="text-center">
                {task.priority}
              </td>

              <td className="text-center">
                <StatusBadge
                  status={task.status}
                />
              </td>

              <td className="text-center">
                {task.due_date}
              </td>

              <td>
                {task.remarks || "-"}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <div className="flex justify-between items-center px-5 py-4 border-t">

        <p className="text-sm text-gray-500">

          Showing

          <span className="mx-1 font-semibold">

            {currentTasks.length}

          </span>

          of

          <span className="mx-1 font-semibold">

            {filteredTasks.length}

          </span>

          tasks

        </p>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

      </div>

    </div>

  );

};

export default MyWorkTable;