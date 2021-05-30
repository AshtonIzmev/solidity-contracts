// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";
import "../assoc/Association.sol";
import "../assoc/Administration.sol";

contract MasterOrg is Context {
    
    constructor() { }
    
    function emitCreation(address _association, string memory _name, string memory _founder) public {
        emit CreationEvent(_association, _name, _founder);
    }

    event CreationEvent(address _association, string _name, string _founder);
}