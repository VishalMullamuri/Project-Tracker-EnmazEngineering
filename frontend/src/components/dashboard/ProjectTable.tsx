  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import { Eye, Search } from "lucide-react";
  import api from "../../api/axios";

  import Pagination from "./Pagination";
  import StatusBadge from "./StatusBadge";
  import AddProjectModal from "./AddProjectModal";
  import ConsolidatedTaskTable from "./ConsolidatedTaskTable";

  import type { Project } from "../../types/project";

  const getProgressColor = (status: string) => {

    switch (status) {

      case "Completed":
        return "bg-green-500";

      case "Delayed":
        return "bg-red-500";

      default:
        return "bg-blue-600";

    }

  };

  type Props = {
    refreshDashboard: () => Promise<void>;
  };

  const ProjectTable = ({
    refreshDashboard,
  }: Props) => {

    
    const navigate = useNavigate();

    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    const isManager =
  user.role === "MANAGER" ||
  user.role === "ADMIN";

    const [projects, setProjects] =
      useState<Project[]>([]);

    const [tab, setTab] =
      useState("All");

    const [search, setSearch] =
      useState("");

    const [openModal, setOpenModal] =
      useState(false);

    const [currentPage, setCurrentPage] =
      useState(1);

    const [showConsolidated, setShowConsolidated] = useState(
  sessionStorage.getItem("showConsolidated") === "true"
);

    const projectsPerPage = 5;
    useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get("/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      setProjects(response.data);

    } catch (error) {

      console.error(error);

    }

  };

  const refreshAll = async () => {

  await fetchProjects();



  if (typeof refreshDashboard === "function") {
    await refreshDashboard();
  }

};
  const createProject = async (project: {
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
}) => {

    try {

      const token =
        localStorage.getItem("token");

      await api.post(
        "/projects",
        {
          ...project,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await refreshAll();

      setOpenModal(false);

    } catch (error) {

      console.error(error);

      alert("Failed to create project.");

    }

  };
  const filteredProjects = projects.filter((project) => {

    const matchesSearch =
      project.project_name
        .toLowerCase()
        .includes(search.toLowerCase());

    if (tab === "All") {
      return matchesSearch;
    }

    if (tab === "Open") {
      return (
        project.status !== "Completed" &&
        matchesSearch
      );
    }

    return (
      project.status === "Completed" &&
      matchesSearch
    );

  });

  const indexOfLastProject =
    currentPage * projectsPerPage;

  const indexOfFirstProject =
    indexOfLastProject - projectsPerPage;

  const currentProjects =
    filteredProjects.slice(
      indexOfFirstProject,
      indexOfLastProject
    );

  const totalPages = Math.ceil(
    filteredProjects.length /
      projectsPerPage
  );

  return (

  <>

    <AddProjectModal
      isOpen={openModal}
      onClose={() => setOpenModal(false)}
      onAddProject={createProject}
    />

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mt-6 overflow-hidden">

      {/* Header */}

      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">

        {/* Search */}

        <div className="relative">

          <Search
            size={16}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder={
              showConsolidated
                ? "Search project or task..."
                : "Search project..."
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="
              w-64
              pl-9
              pr-3
              py-2
              text-sm
              border
              border-gray-300
              rounded-lg
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />

        </div>

        {/* Right Controls */}

        <div className="flex items-center gap-3">

          {!isManager && (
  <button
    onClick={() => {

  if (showConsolidated) {
    sessionStorage.removeItem("taskPage");
  }

  const value = !showConsolidated;

  setShowConsolidated(value);

  sessionStorage.setItem(
    "showConsolidated",
    String(value)
  );

}}
    className={`px-5 py-2 text-sm font-medium rounded-lg transition ${
      showConsolidated
        ? "bg-gray-700 text-white hover:bg-gray-800"
        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
    }`}
  >
    {showConsolidated
      ? "← Back To Projects"
      : "Consolidate"}
  </button>
)}

          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">

            <button
              onClick={() => {
                setTab("All");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === "All"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </button>

            <button
              onClick={() => {
                setTab("Open");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === "Open"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Open
            </button>

            <button
              onClick={() => {
                setTab("Closed");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === "Closed"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              Closed
            </button>

          </div>

          {isManager && (

            <button
              onClick={() =>
                setOpenModal(true)
              }
              className="
                px-4
                py-2
                text-sm
                font-medium
                bg-blue-600
                text-white
                rounded-lg
                hover:bg-blue-700
                transition
              "
            >
              + Add Project
            </button>

          )}

        </div>

      </div>
      {/* Table */}

{!isManager && showConsolidated ? (

  <>

    <ConsolidatedTaskTable
  search={search}
  tab={tab}
/>

    

  </>

) : (

  <table className="w-full">

    <thead className="bg-gray-50">

      <tr className="text-sm text-gray-600">

        <th className="py-3 text-center w-16 font-semibold">
          Sl.No.
        </th>

        <th className="py-3 text-left font-semibold">
          Project Name
        </th>

        <th className="py-3 text-center w-40 font-semibold">
          Status
        </th>

        <th className="py-3 text-center w-56 font-semibold">
          Completion
        </th>

        <th className="py-3 text-center w-36 font-semibold">
          Start Date
        </th>

        <th className="py-3 text-center w-36 font-semibold">
          Delivery
        </th>

        <th className="py-3 text-center w-28 font-semibold">
          Action
        </th>

      </tr>

    </thead>

    <tbody>

      {currentProjects.map((project, index) => (

        <tr
          key={project.id}
          className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200"
        >

          <td className="py-3 text-center text-sm font-medium text-gray-700">
            {indexOfFirstProject + index + 1}
          </td>

          <td className="py-3 font-medium text-gray-800">
            {project.project_name}
          </td>

          <td className="py-3 text-center">
            <StatusBadge status={project.status} />
          </td>

          <td className="py-3 px-5">

            <div className="flex items-center gap-3">

              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">

                <div
                  className={`h-full rounded-full ${getProgressColor(project.status)}`}
                  style={{
                    width: `${project.progress}%`,
                  }}
                />

              </div>

              <span className="w-10 text-xs font-semibold text-gray-700 text-right">
                {project.progress}%
              </span>

            </div>

          </td>

          <td className="py-3 text-center text-sm text-gray-600">
            {project.start_date}
          </td>

          <td className="py-3 text-center text-sm text-gray-600">
            {project.end_date}
          </td>

          <td className="py-3 text-center">

            <button
              onClick={() => {

  sessionStorage.setItem(
    "showConsolidated",
    "false"
  );

  navigate(`/project/${project.id}`, {
    state: {
      project,
    },
  });

}}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                w-24
                py-2
                rounded-lg
                bg-blue-600
                text-white
                text-sm
                font-medium
                hover:bg-blue-700
                transition-all
                duration-200
                shadow-sm
              "
            >

              <Eye size={16} />

              View

            </button>

          </td>

        </tr>

      ))}

    </tbody>

  </table>

)}
{/* Empty State */}

{!showConsolidated && filteredProjects.length === 0 && (

  <div className="py-10 flex flex-col items-center justify-center text-gray-500">

    <div className="text-5xl mb-3">
      📁
    </div>

    <h3 className="text-lg font-semibold text-gray-700">
      No Projects Found
    </h3>

    <p className="text-sm text-gray-500 mt-1">
      Try changing your search or create a new project.
    </p>

  </div>

)}

{/* Footer */}

{!showConsolidated && (

  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">

  <p className="text-sm text-gray-500">
  Showing
  <span className="font-semibold text-gray-700 mx-1">
    {currentProjects.length}
  </span>
  project(s)
</p>

  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />

</div>

)}

    </div>

  </>

);

};

export default ProjectTable;