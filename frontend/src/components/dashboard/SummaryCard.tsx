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
        p-5
      "
    >
      {/* Top */}

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500 font-medium">
            {title}
          </p>

          <h2
            className={`text-4xl font-bold mt-2 ${valueColor}`}
          >
            {value}
          </h2>

        </div>

        <div
          className={`
            w-14
            h-14
            rounded-xl
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

      <p className="text-sm text-gray-400 mt-5">
        {subtitle}
      </p>

    </div>
  );
};

export default SummaryCard;