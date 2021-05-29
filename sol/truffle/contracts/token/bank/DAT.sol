// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GenericProduct.sol";

/**
 * @dev Banking smart contracts - Term Deposit (Depot A Terme)
 * @author AshtonIzmev
 */
contract DAT is GenericProduct {

    using EnumerableSet for EnumerableSet.UintSet;

    uint256 public minimumAmount;
    uint256 public dayDuration;
    uint16 public interestRate;

    struct Product {
        uint256 _subscriptionDate;
        uint256 _subscriptionAmount;
    }

    mapping (uint256 => Product) private _subscriptions;

    /**
     * param minimumAmount      minimum amount deposited
     * param dayDuration        duration of the DAT (in days)
     * param interestRate       interest rate of the DAT
     */
    constructor (uint256 minimumAmount_, uint256 dayDuration_, uint16 interestRate_, 
            address medToken_, address fpToken_) {
        _issuingBank = _msgSender();
        minimumAmount = minimumAmount_;
        dayDuration = dayDuration_;
        interestRate = interestRate_;

        medToken = MED(medToken_);
        fpToken = FP(fpToken_);
    }

    /**
     * Subscribe a new term deposit
     */
    function subscribe(uint256 depositAmount) public virtual {
        require(depositAmount >= minimumAmount, "Deposit amount is less than minimum required");
        require(medToken.allowance(_msgSender(), address(this)) >= depositAmount, "Prepare an allowance with the correct amount in order to subscribe");
        medToken.transferFrom(_msgSender(), address(this), depositAmount);
        fpToken.create(_msgSender(), 0);
        uint256 tokenId = fpToken.getCurrentTokenId();
        _subscriptions[tokenId] = Product(medToken.daysElapsed(), depositAmount);
        _subscriptionIds.add(tokenId);
    }

    /**
     * Cancelling a DAT is getting reimbursed your initial deposit at anytime without any added interest
     */
    function cancelDat(uint256 tokenId) public virtual {
        require(fpToken.ownerOf(tokenId) == _msgSender());
        uint256 initialAmount = _subscriptions[tokenId]._subscriptionAmount;
        medToken.transfer(_msgSender(), initialAmount);
        fpToken.destroy(tokenId);
        _subscriptionIds.remove(tokenId);
    }

    /**
     * Get your principal and your interest once the term ended
     */
    function payDat(uint256 tokenId) public virtual {
        require(medToken.daysElapsed() - _subscriptions[tokenId]._subscriptionDate > dayDuration, 
            "Too early to be payed");
        uint256 initialAmount = _subscriptions[tokenId]._subscriptionAmount;
        medToken.transfer(fpToken.ownerOf(tokenId), initialAmount * (100+interestRate) / 100);
        fpToken.destroy(tokenId);
        _subscriptionIds.remove(tokenId);        
    }

    function getProduct(uint256 tokenId) public view virtual returns (uint256, uint256) {
        return (
            _subscriptions[tokenId]._subscriptionDate,
            _subscriptions[tokenId]._subscriptionAmount);
    }

}