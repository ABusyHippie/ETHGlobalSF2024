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
          <a href="/712" className="dropdown-item">Link 1</a>
          <a href="/7730" className="dropdown-item">Link 2</a>
          <a href="/ledger-live" className="dropdown-item">Link 3</a>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;

