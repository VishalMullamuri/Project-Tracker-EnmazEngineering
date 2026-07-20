import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: Props) => {

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-end items-center gap-2 mt-8">

      <button
        disabled={currentPage === 1}
        onClick={() =>
          onPageChange(currentPage - 1)
        }
        className="w-10 h-10 border rounded-lg hover:bg-gray-100 disabled:opacity-40"
      >
        <ChevronLeft
          size={18}
          className="mx-auto"
        />
      </button>

      {Array.from(
        { length: totalPages },
        (_, index) => (

          <button
            key={index}
            onClick={() =>
              onPageChange(index + 1)
            }
            className={`w-10 h-10 rounded-lg ${
              currentPage === index + 1
                ? "bg-blue-600 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            {index + 1}
          </button>

        )
      )}

      <button
        disabled={
          currentPage === totalPages
        }
        onClick={() =>
          onPageChange(currentPage + 1)
        }
        className="w-10 h-10 border rounded-lg hover:bg-gray-100 disabled:opacity-40"
      >
        <ChevronRight
          size={18}
          className="mx-auto"
        />
      </button>

    </div>
  );
};

export default Pagination;