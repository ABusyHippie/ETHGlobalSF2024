import React, { useState } from 'react';

const DropdownMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown">
      <button onClick={toggleDropdown} className="dropdown-button">
        Menu
      </button>
      {isOpen && (
        <div className="dropdown-content">
          <a href="/link1" className="dropdown-item">Link 1</a>
          <a href="/link2" className="dropdown-item">Link 2</a>
          <a href="/link3" className="dropdown-item">Link 3</a>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;

