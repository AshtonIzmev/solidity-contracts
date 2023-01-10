// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";

abstract contract Institution is Context {
    
    bytes32 _pubKeyHalf1;
    bytes32 _pubKeyHalf2;

    uint8 public kind;
    string public name;
    
    function emitCreation(address _instit, string memory _name,  uint8 _kind) public {
        emit CreationEvent(_instit, _name, _kind);
    }

    event CreationEvent(address _instit, string _name, uint8 _kind);
}

contract School is Institution {

    struct AlumniStruct {
        string privateInfoSchool;
        string hashSchool;
        string school;
        int year;
        bool isPublic;
    }
    mapping (address => AlumniStruct) alumnis;

    
    constructor(bytes32 _pkh1, bytes32 _pkh2, string memory _name) {
        _pubKeyHalf1 = _pkh1;
        _pubKeyHalf2 = _pkh2;
        kind = 0;
        name = _name;
        emitCreation(address(this), _name, 0);
    }

    function registerAlumni(string memory _infos, string memory _hashSchool, 
            string memory _school, int16 _year, bool _isPublic) public {
        AlumniStruct memory newAlumni;
        newAlumni.privateInfoSchool = _infos;
        newAlumni.hashSchool = _hashSchool;
        newAlumni.school = _school;
        newAlumni.year = _year;
        newAlumni.isPublic = _isPublic;
        alumnis[_msgSender()] = newAlumni;
        emit AlumniEvent(newAlumni);
    }

    event AlumniEvent(AlumniStruct alumni);
}

contract Company is Institution {

    mapping (address => string) privateInfosCompany;

    constructor(bytes32 _pkh1, bytes32 _pkh2, string memory _name) {
        _pubKeyHalf1 = _pkh1;
        _pubKeyHalf2 = _pkh2;
        kind = 1;
        name = _name;
        emitCreation(address(this), _name, 1);
    }

    function addCompany(string memory _infos) public {
        privateInfosCompany[_msgSender()] = _infos;
        emit DiplomaSubmission(_msgSender(), _infos);
    }

    event DiplomaSubmission(address _owner, string _infos);

}
