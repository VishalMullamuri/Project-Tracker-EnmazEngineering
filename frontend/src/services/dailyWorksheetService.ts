import api from "../api/axios";

export type DailyWorksheetTaskStatus =
  | "Not Started"
  | "In Progress"
  | "Completed";

export interface DailyWorksheetTask {
  id?: number;
  title: string;
  description: string | null;
  status: DailyWorksheetTaskStatus;
  remarks: string | null;
}

export interface DailyWorksheetResponse {
  employee_name: string;
  id: number;
  employee_id: number;
  worksheet_date: string;
  tasks: DailyWorksheetTask[];
}

export interface DailyWorksheetUpdateData {
  tasks: DailyWorksheetTask[];
}

export const getDailyWorksheet = async (
  date: string,
  employeeId?: number
): Promise<DailyWorksheetResponse | null> => {
  const response = await api.get<DailyWorksheetResponse | null>(
    "/daily-worksheets",
    {
      params: {
        date,
        ...(employeeId !== undefined
          ? { employee_id: employeeId }
          : {}),
      },
    }
  );

  return response.data;
};

export const updateDailyWorksheet = async (
  date: string,
  employeeId: number | undefined,
  data: DailyWorksheetUpdateData
): Promise<DailyWorksheetResponse> => {
  const response = await api.put<DailyWorksheetResponse>(
    "/daily-worksheets",
    data,
    {
      params: {
        date,
        ...(employeeId !== undefined
          ? { employee_id: employeeId }
          : {}),
      },
    }
  );

  return response.data;
};

export const deleteDailyWorksheet = async (
  taskId: number
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/daily-worksheets/tasks/${taskId}`
  );

  return response.data;
};