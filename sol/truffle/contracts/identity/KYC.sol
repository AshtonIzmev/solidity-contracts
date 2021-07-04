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
    
    function submitKYC(string memory _name, string memory _identityDocument, address _add) public {
        require(!ecitizen[_add], "Unvalidated");
        // Special offer : everyone is verified
        ecitizen[_add] = true; // for the sake of simplification
        emit IdentitySubmission(_add, _name, _identityDocument);
        emit IdentityValidation(_add);
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