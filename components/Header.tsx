import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8 md:mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 mb-2">
        AI Logo Animator
      </h1>
      <p className="text-lg text-gray-400">
        From Concept to Motion in Seconds
      </p>
    </header>
  );
};

export default Header;
