import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-machineGray/10 rounded-sm overflow-hidden border-2 border-machineGray/50 animate-pulse flex flex-col">
      <div className="h-40 sm:h-48 md:h-56 lg:h-64 bg-pitchBlack w-full border-b border-machineGray/50" />
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col gap-4 flex-1">
        <div className="h-7 bg-machineGray/50 rounded-sm w-3/4" />
        <div className="h-4 bg-machineGray/50 rounded-sm w-1/2" />
        <div className="mt-auto flex justify-between pt-6 border-t border-machineGray/30">
          <div className="h-6 bg-machineGray/50 rounded-sm w-1/3" />
          <div className="h-6 bg-machineGray/50 rounded-sm w-1/4" />
        </div>
        <div className="mt-8 h-14 bg-machineGray/50 rounded-sm w-full" />
      </div>
    </div>
  );
};

export default SkeletonCard;
