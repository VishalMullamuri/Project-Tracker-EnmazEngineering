type SummaryCardProps = {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  valueColor = "text-slate-900",
}: SummaryCardProps) => {
  return (
    <div
      className="
        bg-white
        rounded-xl
        border
        border-gray-200
        shadow-sm
        hover:shadow-md
        transition
        px-4
        py-3
      "
    >
      {/* Top */}

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs text-gray-500 font-medium">
            {title}
          </p>

          <h2
            className={`text-3xl font-bold mt-1 ${valueColor}`}
          >
            {value}
          </h2>

        </div>

        <div
          className={`
            w-10
            h-10
            rounded-lg
            flex
            items-center
            justify-center
            ${iconBg}
          `}
        >
          {icon}
        </div>

      </div>

      {/* Bottom */}

      <p className="text-xs text-gray-400 mt-2">
        {subtitle}
      </p>

    </div>
  );
};

export default SummaryCard;