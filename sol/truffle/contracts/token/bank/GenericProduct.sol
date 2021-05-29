// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/Context.sol";
import "../../utils/EnumerableSet.sol";
import "../med/MED.sol";
import "../nft/FP.sol";

/**
 * @dev Generic Banking smart contracts
 * @author AshtonIzmev
 */
abstract contract GenericProduct is Context {

    using EnumerableSet for EnumerableSet.UintSet;

    MED internal medToken;
    FP internal fpToken;

    address internal _issuingBank;

    EnumerableSet.UintSet internal _subscriptionIds;

    modifier onlyIssuingBank() {
        require(
            _msgSender() == _issuingBank,
            "Only Issuing Bank is allowed to call this"
        );
        _;
    }

    function isSuscribed(uint256 tokenId) public virtual view returns (bool) {
        return _subscriptionIds.contains(tokenId);
    }

    function getSubscription(uint256 idx) public virtual view returns (uint256) {
        require(idx < _subscriptionIds.length(), "Idx overflow");
        return _subscriptionIds.at(idx);
    }

    function getSubscriptionLength() public virtual view returns (uint256) {
        return _subscriptionIds.length();
    }

}