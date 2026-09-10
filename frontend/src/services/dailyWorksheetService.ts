import api from "../api/axios";

export const getDailyWorksheet = async (
  date: string,
  employeeId?: number
) => {
  const params: {
    date: string;
    employee_id?: number;
  } = {
    date,
  };

  if (employeeId !== undefined) {
    params.employee_id = employeeId;
  }

  const response = await api.get(
    "/daily-worksheets",
    { params }
  );

  return response.data;
};

export const updateDailyWorksheet = async (
  date: string,
  employeeId: number | undefined,
  data: any
) => {
  const params: {
    date: string;
    employee_id?: number;
  } = {
    date,
  };

  if (employeeId !== undefined) {
    params.employee_id = employeeId;
  }

  const response = await api.put(
    "/daily-worksheets",
    data,
    { params }
  );

  return response.data;
};

export const deleteDailyWorksheet = async (
  taskId: string | number
) => {
  const response = await api.delete(
    `/daily-worksheets/tasks/${taskId}`
  );

  return response.data;
};