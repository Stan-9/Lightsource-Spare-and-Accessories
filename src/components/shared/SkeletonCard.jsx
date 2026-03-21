import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-gray-800/30 rounded-[2rem] overflow-hidden border border-gray-700/50 animate-pulse">
      <div className="h-64 bg-gray-900 w-full" />
      <div className="p-6 flex flex-col gap-4">
        <div className="h-7 bg-gray-800/80 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-800/80 rounded-lg w-1/2" />
        <div className="mt-4 flex justify-between">
          <div className="h-6 bg-gray-800/80 rounded-lg w-1/3" />
          <div className="h-6 bg-gray-800/80 rounded-lg w-1/4" />
        </div>
        <div className="mt-6 h-14 bg-gray-800/80 rounded-2xl w-full" />
      </div>
    </div>
  );
};

export default SkeletonCard;
