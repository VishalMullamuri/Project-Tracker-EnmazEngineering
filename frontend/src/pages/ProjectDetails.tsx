import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import api from "../api/axios";
import type { Project } from "../types/project";
import type { Task } from "../components/project/AddTaskModal";
import ProjectHeader from "../components/project/ProjectHeader";
import ProjectSummary from "../components/project/ProjectSummary";
import TaskTable from "../components/project/TaskTable";
import TeamMembers from "../components/project/TeamMembers";
import type { Employee } from "../types/employee";
const ProjectDetails = () => {

  const [teamRefresh, setTeamRefresh] =
    useState(0);

  const { state } =
    useLocation();

  const { id } =
    useParams();

  const [project, setProject] =
    useState<Project | null>(
      state?.project ?? null
    );

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [members, setMembers] =
    useState<Employee[]>([]);

  const fetchMembers = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const assignments =
        await api.get(
          `/project-employees/${id}`,
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
        assignments.data
          .map(
            (item: any) =>
              employeeMap.get(
                item.employee_id
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

  useEffect(() => {

    fetchProject();
    fetchTasks();
    fetchMembers();

  }, []);

  const fetchProject = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          `/projects/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setProject(response.data);

    } catch (error) {

      console.error(error);

    }

  };

  const fetchTasks = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          "/tasks",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const projectTasks =
        response.data.filter(
          (task: Task) =>
            Number(task.project_id) ===
            Number(id)
        );

      setTasks(projectTasks);

    } catch (error) {

      console.error(error);

    }

  };
    if (!project) {

    return (

      <Layout>

        <div className="p-6">
          Project not found.
        </div>

      </Layout>

    );

  }

  return (

    <Layout>

      <div className="space-y-6">

        <ProjectHeader
  project={project}
  onProjectUpdated={async () => {
    await fetchProject();
    await fetchTasks();
    await fetchMembers();
    setTeamRefresh((prev) => prev + 1);
  }}
/>

        <ProjectSummary
          tasks={tasks}
        />

        <TeamMembers
  key={teamRefresh}
  projectId={project.id}
/>

<TaskTable
  projectId={project.id}
  tasks={tasks}
  employees={members}
  refreshTasks={fetchTasks}
  refreshProject={async () => {
    await fetchProject();
    await fetchMembers();
  }}
/>

      </div>

    </Layout>

  );

};

export default ProjectDetails;