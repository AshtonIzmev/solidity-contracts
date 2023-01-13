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

contract School is Institution {

    struct AlumniStruct {
        string privateInfoSchool;
        bytes32 hashInfos;
        int year;
        bool isPublic;
    }
    mapping (address => AlumniStruct) public alumnis;
    mapping (address => bool) public validations;

    
    constructor(bytes32 _pkh1, bytes32 _pkh2, string memory _name) {
        _pubKeyHalf1 = _pkh1;
        _pubKeyHalf2 = _pkh2;
        owner = _msgSender();
        kind = 0;
        name = _name;
        emitCreation(address(this), _name, 0);
    }

    function register(string memory _infos, bytes32 _hashInfos, 
            int16 _year, bool _isPublic) public {
        require(keccak256(abi.encodePacked(_infos)) == _hashInfos, 
            "Hashed Data does not correspond to said infos");
        AlumniStruct memory newAlumni;
        newAlumni.privateInfoSchool = _infos;
        newAlumni.hashInfos = _hashInfos;
        newAlumni.year = _year;
        newAlumni.isPublic = _isPublic;
        alumnis[_msgSender()] = newAlumni;
        emit AlumniEvent(newAlumni);
    }

    function validate(address alumni) public onlyOwner {
        validations[alumni] = true;
    }

    event AlumniEvent(AlumniStruct alumni);
}

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

    function submit(string memory _infos) public {
        infosCompany[_msgSender()] = _infos;
        emit DiplomaSubmission(_msgSender(), _infos);
    }

    event DiplomaSubmission(address _owner, string _infos);

}
