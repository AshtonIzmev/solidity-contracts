// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GenericProduct.sol";

/**
 * @dev Banking smart contracts - Mudaraba
 * @author AshtonIzmev
 */
contract Mudaraba is GenericProduct {

    using EnumerableSet for EnumerableSet.UintSet;

    string public description;
    string public ice;

    uint256 public totalCapital;
    uint256 public capitalCap;

    struct Product {
        uint256 _subscriptionDate;
        uint256 _subscriptionAmount;
    }

    mapping (uint256 => Product) private _subscriptions;

    /**
     * param description_       Description of the company
     * param ice_               Unique Identification Number of a company
     * param capital_           Initial capital
     */
    constructor (string memory description_, string memory ice_, uint256 capitalCap_,
    address medToken_, address fpToken_) {
        _issuingBank = _msgSender();
        description = description_;
        ice = ice_;
        capitalCap = capitalCap_;

        medToken = MED(medToken_);
        fpToken = FP(fpToken_);
    }

    /**
     * Subscribe a new Moudaraba product
     */
    function subscribe(uint256 depositAmount) public virtual {
        require(totalCapital + depositAmount < capitalCap, "Capital cap exceeded");
        require(medToken.allowance(_msgSender(), address(this)) >= depositAmount, "Prepare an allowance with the correct amount in order to subscribe");
        medToken.transferFrom(_msgSender(), address(this), depositAmount);
        fpToken.create(_msgSender(), 2);
        uint256 tokenId = fpToken.getCurrentTokenId();
        _subscriptions[tokenId] = Product(medToken.daysElapsed(), depositAmount);
        _subscriptionIds.add(tokenId);
        totalCapital = totalCapital + depositAmount;
    }

    /**
     * Add fund to an existing Mudaraba fund (only the token owner)
     */
    function addFund(uint256 tokenId, uint256 depositAmount) public virtual {
        require(fpToken.ownerOf(tokenId) == _msgSender());
        _addFund(tokenId, depositAmount);
    }

    /**
     * Withdraw amount for the Mudaraba fund (only the token owner)
     */
    function withdrawFund(uint256 tokenId, uint256 withdrawnAmount) public virtual {
        require(fpToken.ownerOf(tokenId) == _msgSender());
        _withdrawFund(tokenId, withdrawnAmount);
    }

    function distributeProfit(uint256 profitAmount) public virtual onlyIssuingBank {
        // Can exceed capital cap
        uint256 totalCapitalTmp = totalCapital;
        for (uint idx=0; idx < getSubscriptionLength(); idx++) {
            uint256 tokenId = getSubscription(idx);
            Product memory prod = _subscriptions[tokenId];
            uint256 depositAmount = (profitAmount * prod._subscriptionAmount) / totalCapitalTmp;
            _addFund(tokenId, depositAmount);
        }
        emit Profit(profitAmount);
    }

    function takeLoss(uint256 lossAmount) public virtual onlyIssuingBank {
        require(totalCapital >= lossAmount, "Capital cap exceeded");
        uint256 totalCapitalTmp = totalCapital;
        for (uint idx=0; idx < getSubscriptionLength(); idx++) {
            uint256 tokenId = getSubscription(idx);
            Product memory prod = _subscriptions[tokenId];
            uint256 withdrawnAmount = (lossAmount * prod._subscriptionAmount) / totalCapitalTmp;
            _withdrawFund(tokenId, withdrawnAmount);
        }
        emit Loss(lossAmount);
    }

    function getProduct(uint256 tokenId) public view virtual returns (uint256, uint256) {
        return (
            _subscriptions[tokenId]._subscriptionDate,
            _subscriptions[tokenId]._subscriptionAmount);
    }

    /* ********************************************************* */
    /* * * * * * * * * *  Internal functions * * * * * * * * * * */
    /* ********************************************************* */

    function _addFund(uint256 tokenId, uint256 depositAmount) internal virtual {
        require(isSuscribed(tokenId), "Existing Mudaraba subscription");
        Product memory prod = _subscriptions[tokenId];
        require(totalCapital + depositAmount < capitalCap, "Capital cap exceeded");
        medToken.transferFrom(_msgSender(), address(this), depositAmount);
        _subscriptions[tokenId] = Product(medToken.daysElapsed(), prod._subscriptionAmount + depositAmount);
        totalCapital = totalCapital + depositAmount;
    }

    function _withdrawFund(uint256 tokenId, uint256 withdrawnAmount) internal virtual {
        require(isSuscribed(tokenId), "Existing Mudaraba subscription");
        Product memory prod = _subscriptions[tokenId];
        require(prod._subscriptionAmount >= withdrawnAmount, "Withdrawn amount must be less than total product");
        medToken.transfer(_msgSender(), withdrawnAmount);
        _subscriptions[tokenId] = Product(medToken.daysElapsed(), prod._subscriptionAmount - withdrawnAmount);
        if (prod._subscriptionAmount == withdrawnAmount) {
            fpToken.destroy(tokenId);
            _subscriptionIds.remove(tokenId);        
        }
        totalCapital = totalCapital - withdrawnAmount;
    }

    event Profit(uint256 value);
    event Loss(uint256 value);

}
