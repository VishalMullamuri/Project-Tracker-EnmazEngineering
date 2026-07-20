export interface Project {
  id: number;
  project_name: string;
  description: string;
  status: string;
  progress: number;
  start_date: string;
  end_date: string;
  created_by: number;
}