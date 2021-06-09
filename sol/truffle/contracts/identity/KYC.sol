// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";

contract KYC is Context {
    
    address public owner;
    mapping (address => bool) public ecitizen;

    modifier onlyOwner() {
        require(
            _msgSender() == owner,
            "Only owner is allowed to call this"
        );
        _;
    }

    constructor() {
        owner = _msgSender();
    }
    
    function submitKYC(string memory _name, string memory _identityDocument) public {
        // Special offer : everyone is verified
        ecitizen[_msgSender()] = true; // for the sake of simplification
        emit IdentitySubmission(_msgSender(), _name, _identityDocument);
        emit IdentityValidation(_msgSender());
    }

    function validateKYC(address _add) public onlyOwner {
        ecitizen[_add] = true;
        emit IdentityValidation(_msgSender());
    }

    function unvalidateKYC(address _add) public onlyOwner {
        ecitizen[_add] = false;
        emit IdentityRejection(_msgSender());
    }

    function isIdentified(address _add) public view returns(bool) {
        return ecitizen[_add];
    }

    event IdentitySubmission(address _add, string _name, string _identityDocument);
    event IdentityValidation(address _add);
    event IdentityRejection(address _add);
}