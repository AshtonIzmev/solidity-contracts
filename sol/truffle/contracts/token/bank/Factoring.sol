// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GenericProduct.sol";

/**
 * @dev Banking smart contracts - Factoring
 * @author AshtonIzmev
 */
contract Factoring is GenericProduct {

    using EnumerableSet for EnumerableSet.UintSet;

    struct Product {
        address _borrower;
        uint256 _factoringDate;
        uint256 _factoringAmount;
        bool _validated;
    }

    mapping (uint256 => Product) private _subscriptions;

    constructor (address medToken_, address fpToken_) {
        medToken = MED(medToken_);
        fpToken = FP(fpToken_);
    }

    /**
     * Get a token in exchange of an invoice
     */
    function sellInvoice(uint256 invoiceAmount_, address borrower_) public virtual {
        fpToken.create(_msgSender(), 1);
        uint256 tokenId = fpToken.getCurrentTokenId();
        _subscriptions[tokenId] = Product(borrower_, medToken.daysElapsed(), invoiceAmount_, false);
        _subscriptionIds.add(tokenId);
    }

    /**
     * Validate an invoice
     */
    function validateInvoice(uint256 tokenId) public virtual {
        require(isSuscribed(tokenId), "Existing Factoring subscription");
        Product memory prod = _subscriptions[tokenId];
        require(prod._borrower == _msgSender(), "Only borrower can validate");
        _subscriptions[tokenId] = 
            Product(prod._borrower, prod._factoringDate, prod._factoringAmount, true);
    }

    /**
     * Pay the owner of the FP NFT invoice representation
     */
    function payInvoice(uint256 tokenId) public virtual {
        require(isSuscribed(tokenId), "Existing Factoring subscription");
        Product memory prod = _subscriptions[tokenId];
        require(prod._borrower == _msgSender(), "Only borrower can pay");
        medToken.transferFrom(_msgSender(), fpToken.ownerOf(tokenId), prod._factoringAmount);
        fpToken.destroy(tokenId);
        _subscriptionIds.remove(tokenId);
    }

    function getProduct(uint256 tokenId) public view virtual returns (address, uint256, uint256, bool) {
        return (
            _subscriptions[tokenId]._borrower,
            _subscriptions[tokenId]._factoringDate,
            _subscriptions[tokenId]._factoringAmount,
            _subscriptions[tokenId]._validated);
    }

}