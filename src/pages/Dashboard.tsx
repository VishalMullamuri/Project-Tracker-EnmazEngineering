import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import SummaryCard from "../components/dashboard/SummaryCard";
import ProjectTable from "../components/dashboard/ProjectTable";
import api from "../api/axios";

import {
  FolderKanban,
  Hourglass,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type DashboardStats = {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  delayed_projects: number;
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
  total_projects: 0,
  active_projects: 0,
  completed_projects: 0,
  delayed_projects: 0,
});

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(response.data);
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-4 gap-5">

        <SummaryCard
          title="Total Projects"
          value={stats.total_projects}
          subtitle="All Projects"
          icon={
            <FolderKanban
              size={28}
              className="text-blue-600"
            />
          }
          iconBg="bg-blue-100"
        />

       <SummaryCard
  title="Delayed Projects"
  value={stats.delayed_projects}
  subtitle="Need Attention"
  valueColor="text-red-600"
  icon={
    <Hourglass
      size={28}
      className="text-red-600"
    />
  }
  iconBg="bg-red-100"
/>

        <SummaryCard
          title="Completed"
          value={stats.completed_projects}
          subtitle="Finished Projects"
          valueColor="text-green-600"
          icon={
            <CheckCircle2
              size={28}
              className="text-green-600"
            />
          }
          iconBg="bg-green-100"
        />

        <SummaryCard
          title="In Progress"
          value={stats.active_projects}
          subtitle="Currently Running"
          valueColor="text-blue-600"
          icon={
            <Clock3
              size={28}
              className="text-blue-600"
            />
          }
          iconBg="bg-blue-100"
        />

      </div>

      <ProjectTable
  refreshDashboard={fetchDashboardStats}
/>
    </Layout>
  );
};

export default Dashboard;