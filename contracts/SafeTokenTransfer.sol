// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SafeTokenTransfer {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function sendTokens(address token, address recipient, uint256 amount) public {
        require(recipient != address(0), "Recipient cannot be the zero address");
        require(amount > 0, "Amount must be greater than zero");

        IERC20(token).transfer(recipient, amount);
    }

    function getTokenBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}