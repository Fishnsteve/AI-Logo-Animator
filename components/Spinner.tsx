import React from 'react';

interface SpinnerProps {
  message: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700">
      <div className="w-16 h-16 border-4 border-t-sky-400 border-r-sky-400 border-b-gray-600 border-l-gray-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-300 text-center">{message}</p>
    </div>
  );
};

export default Spinner;
