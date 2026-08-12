import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    name: "Completed",
    value: 12,
  },
  {
    name: "In Progress",
    value: 8,
  },
  {
    name: "Delayed",
    value: 4,
  },
];

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
];

const StatusChart = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-xl transition">

      <h2 className="font-semibold text-base mb-3">
        Project Status
      </h2>

      <div className="flex items-center justify-between">

        <div className="w-40 h-40">

          <ResponsiveContainer>

            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
              >

                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}

              </Pie>

            </PieChart>

          </ResponsiveContainer>

        </div>

        <div className="space-y-4">

          {data.map((item, index) => (

            <div
              key={item.name}
              className="flex items-center gap-3"
            >

              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: COLORS[index],
                }}
              />

              <span className="text-gray-700">
                {item.name}
              </span>

              <span className="font-semibold ml-6">
                {item.value}
              </span>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default StatusChart;