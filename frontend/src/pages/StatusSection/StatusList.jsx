import React from "react";
import formatTimestamp from "../../utils/formatTime";

const StatusList = ({ contact, onPreview, theme }) => {
  return (
    <div 
      className="cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={() => onPreview && onPreview(contact)} // ✅ Trigger preview
    >
      <div className="relative">
        <img
          src={contact?.avatar}
          alt={contact?.name}
          className="h-14 w-14 rounded-full"
        />
        <svg
          className="absolute top-0 left-0 w-14 h-14"
          viewBox="0 0 100 100"
        >
          {contact?.statuses?.map((_, index) => (
            <circle
              key={index}
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="#25D366"
              strokeWidth="4"
              transform="rotate(-90 50 50)"
            />
          ))}
        </svg>
      </div>

      <p className="font-semibold mt-1">{contact?.name}</p>
      <p
        className={`text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {formatTimestamp(
          contact.statuses[contact.statuses.length - 1].timestamp
        )}
      </p>
    </div>
  );
};

export default StatusList;
