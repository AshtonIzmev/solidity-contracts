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

    mapping (uint256 => uint16) public allowedParams;

    struct Product {
        uint256 _subscriptionDate;
        uint256 _subscriptionDuration;
        uint256 _subscriptionAmount;
        address _owner;
    }

    mapping (uint256 => Product) private _subscriptions;

    modifier onlyOwner() {
        require(
            _msgSender() == _issuingBank,
            "Only owner is allowed to call this"
        );
        _;
    }

    /**
     * param minimumAmount      minimum amount deposited
     */
    constructor (uint256 minimumAmount_, address medToken_, address fpToken_) {
        _issuingBank = _msgSender();
        minimumAmount = minimumAmount_;
        medToken = MED(medToken_);
        fpToken = FP(fpToken_);
    }

    /**
     * Set parameters for a new product
     */
    function setProduct(uint256 dayDuration, uint16 interestRate) public virtual onlyOwner {
        require(dayDuration > 0, "Duration in days must be in te future");
        require(interestRate > 0, "Rate must be a non zero value");
        allowedParams[dayDuration] = interestRate;
    }

    /**
     * Subscribe a new term deposit
     */
    function subscribe(uint256 depositAmount, uint256 dayDuration, uint16 interestRate) public virtual {
        require(allowedParams[dayDuration] == interestRate, "Must be existing product");
        require(depositAmount >= minimumAmount, "Deposit amount is less than minimum required");
        require(medToken.allowance(_msgSender(), address(this)) >= depositAmount, "Prepare an allowance with the correct amount in order to subscribe");
        medToken.transferFrom(_msgSender(), address(this), depositAmount);
        fpToken.create(_msgSender(), 0);
        uint256 tokenId = fpToken.getCurrentTokenId();
        _subscriptions[tokenId] = Product(medToken.daysElapsed(), dayDuration, depositAmount, _msgSender());
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
        uint16 interestRate = allowedParams[_subscriptions[tokenId]._subscriptionDuration];
        require(medToken.daysElapsed() - _subscriptions[tokenId]._subscriptionDate > _subscriptions[tokenId]._subscriptionDuration, 
            "Too early to be payed");
        uint256 initialAmount = _subscriptions[tokenId]._subscriptionAmount;
        medToken.transfer(fpToken.ownerOf(tokenId), initialAmount * (100+interestRate) / 100);
        fpToken.destroy(tokenId);
        _subscriptionIds.remove(tokenId);        
    }

    function getProduct(uint256 tokenId) public view virtual returns (uint256, uint256, uint256, address) {
        return (
            _subscriptions[tokenId]._subscriptionDate,
            _subscriptions[tokenId]._subscriptionDuration,
            _subscriptions[tokenId]._subscriptionAmount,
            _subscriptions[tokenId]._owner);
    }

}