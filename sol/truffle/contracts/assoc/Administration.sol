// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";
import "../assoc/Association.sol";

abstract contract AssociationAdministration is Context {
    
    enum AdminAction {MEMBERBAN, OWNERCHANGE, SELFDESTRUCT, COOPTATION, REFERENDUM}
    
    AssociationOrg public assoCtr;

    address public proposedMember;
    mapping (address => bool) public didVotes;
    uint public voteCount;
    
    modifier onlyMembers() {
        require(
            assoCtr.members(_msgSender()),
            "Only members are allowed to call this"
        );
        _;
    }

    /// Vote for the administration action
    function vote() public onlyMembers {
        if (!didVotes[_msgSender()]) {
            didVotes[_msgSender()] = true;
            voteCount ++;
        }
    }

    /// Unvote for the administration action
    function unvote() public onlyMembers {
        if (didVotes[_msgSender()]) {
            didVotes[_msgSender()] = false;
            voteCount --;
        }
    }

    function getAdminActionType() public virtual view returns (AdminAction);
}

contract AssociationAdministrationMemberban is AssociationAdministration {
    AdminAction public adminAction = AdminAction.MEMBERBAN;
    constructor(address _assoCtr, address payable _proposedMember) {
        proposedMember = _proposedMember;
        assoCtr = AssociationOrg(_assoCtr);
        assoCtr.emitAdmin(address(this), uint(adminAction));
        require(assoCtr.members(_proposedMember), "Only members can be banned");
        require(_proposedMember != assoCtr.owner(), "Owner cannot be banned, change owner first");
    }
    function getAdminActionType() public override view returns (AdminAction) {
        return adminAction;
    }
}

contract AssociationAdministrationOwnerchange is AssociationAdministration {
    AdminAction public adminAction = AdminAction.OWNERCHANGE;
    constructor(address _assoCtr) {
        proposedMember = _msgSender();
        assoCtr = AssociationOrg(_assoCtr);
        require(_msgSender() != assoCtr.owner(), "New owner cannot be old owner");
    }
    function getAdminActionType() public override view returns (AdminAction) {
        return adminAction;
    }
}

contract AssociationAdministrationSelfdestruct is AssociationAdministration {
    AdminAction public adminAction = AdminAction.SELFDESTRUCT;
    constructor(address _assoCtr) {
        assoCtr = AssociationOrg(_assoCtr);
    }
    function getAdminActionType() public override view returns (AdminAction) {
        return adminAction;
    }
}

contract AssociationAdministrationCooptation is AssociationAdministration {
    AdminAction public adminAction = AdminAction.COOPTATION;
    string public memberName;
    constructor(address _assoCtr, string memory _memberName) {
        require(bytes(_memberName).length > 0, "Member name cannot be empty");
        proposedMember = _msgSender();
        memberName = _memberName;
        assoCtr = AssociationOrg(_assoCtr);
    }
    function getAdminActionType() public override view returns (AdminAction) {
        return adminAction;
    }
}

contract AssociationAdministrationReferendum is AssociationAdministration {
    AdminAction public adminAction = AdminAction.REFERENDUM;
    string public referendumQuestion;
    constructor(address _assoCtr, string memory _question) {
        require(bytes(_question).length > 0, "Question name cannot be empty");
        proposedMember = _msgSender();
        assoCtr = AssociationOrg(_assoCtr);
        referendumQuestion = _question;
    }
    function getAdminActionType() public override view returns (AdminAction) {
        return adminAction;
    }
}