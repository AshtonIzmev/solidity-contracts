// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";
import "./Institution.sol";

contract Company is Institution {

    mapping (address => string) public infosCompany;

    constructor(bytes32 _pkh1, bytes32 _pkh2, string memory _name) {
        _pubKeyHalf1 = _pkh1;
        _pubKeyHalf2 = _pkh2;
        owner = _msgSender();
        kind = 1;
        name = _name;
        emitCreation(address(this), _name, 1);
    }

    function submit(string memory _infos, bool _isPublic) public {
        infosCompany[_msgSender()] = _infos;
        emit DiplomaSubmission(_msgSender(), _infos);
    }

    event DiplomaSubmission(address _owner, string _infos);

}
