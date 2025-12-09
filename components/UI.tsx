import React from 'react';

interface UIProps {
  isTreeForm: boolean;
  onToggle: () => void;
}

const UI: React.FC<UIProps> = ({ isTreeForm, onToggle }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12 z-10">
      {/* Header */}
      <header className="flex flex-col items-start">
        <h1 className="text-3xl md:text-5xl font-serif text-[#FFD700] tracking-widest uppercase drop-shadow-lg">
          Arix Signature
        </h1>
        <p className="text-[#044f2a] text-sm md:text-base font-light tracking-[0.3em] bg-[#FFD700] px-2 py-1 mt-2">
          HOLIDAY COLLECTION
        </p>
      </header>

      {/* Controls */}
      <div className="flex flex-col items-center mb-8 pointer-events-auto">
        <button
          onClick={onToggle}
          className={`
            relative px-8 py-3 overflow-hidden transition-all duration-500 ease-out 
            border border-[#FFD700] rounded-full group
            bg-opacity-20 backdrop-blur-md
            ${isTreeForm ? 'bg-[#001a0f]' : 'bg-[#044f2a]'}
          `}
        >
          <span className={`
            absolute inset-0 w-full h-full bg-[#FFD700] opacity-10 
            group-hover:opacity-20 transition-opacity duration-300
          `}></span>
          <span className="relative text-[#FFD700] font-serif tracking-widest text-lg">
            {isTreeForm ? 'SCATTER ESSENCE' : 'ASSEMBLE FORM'}
          </span>
        </button>
        
        <p className="mt-4 text-[#FFD700] opacity-60 text-xs tracking-widest">
          INTERACTIVE 3D EXPERIENCE
        </p>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-[#FFD700] opacity-30"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-[#FFD700] opacity-30"></div>
    </div>
  );
};

export default UI;
