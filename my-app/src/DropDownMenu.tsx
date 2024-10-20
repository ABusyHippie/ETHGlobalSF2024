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
          <a href="https://developers.ledger.com/docs/clear-signing/eip712" className="dropdown-item">EIP 712 Docs</a>
          <a href="https://developers.ledger.com/docs/clear-signing/erc7730" className="dropdown-item">ERC 7730 Docs</a>
          <a href="/ledger-live" className="dropdown-item">Link 3</a>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;

