import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MyWorkTable from "../components/mywork/MyWorkTable";
import Layout from "../components/layout/Layout";
import SummaryCards from "../components/mywork/SummaryCards";
import api from "../api/axios";

const MyWork = () => {

    const navigate = useNavigate();

  const [summary, setSummary] = useState({
    total_projects: 0,
    total_tasks: 0,
    open_tasks: 0,
    closed_tasks: 0,
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {

      const token = localStorage.getItem("token");

      const response = await api.get(
        "/tasks/my-work",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSummary(response.data);

    } catch (error) {
      console.error(error);
    }
  };

  return (
<Layout>

  <button
    onClick={() => navigate("/dashboard")}
    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition mb-5"
  >
    <ArrowLeft size={18} />
    Back to Dashboard
  </button>

  <h1 className="text-3xl font-bold text-slate-800 mb-8">
    My Work
  </h1>

      <SummaryCards
        totalProjects={summary.total_projects}
        totalTasks={summary.total_tasks}
        openTasks={summary.open_tasks}
        closedTasks={summary.closed_tasks}
      />

      <MyWorkTable />

    </Layout>
  );
};

export default MyWork;