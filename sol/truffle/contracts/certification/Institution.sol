// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";

abstract contract Institution is Context {
    
    bytes32 _pubKeyHalf1;
    bytes32 _pubKeyHalf2;

    address public owner;
    uint8 public kind;
    string public name;

    modifier onlyOwner() {
        require(
            _msgSender() == owner,
            "Only owner is allowed to call this"
        );
        _;
    }
    
    function emitCreation(address _instit, string memory _name,  uint8 _kind) public {
        emit CreationEvent(_instit, _name, _kind);
    }

    event CreationEvent(address _instit, string _name, uint8 _kind);
}