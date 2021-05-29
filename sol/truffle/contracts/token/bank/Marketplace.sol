// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/Context.sol";
import "../../utils/Counters.sol";
import "../../utils/EnumerableSet.sol";
import "../nft/FP.sol";
import "../med/MED.sol";

/**
 * @title ERC721 Financial Product Marketplace
 * @author AshtonIzmev
 */
contract Marketplace is IERC721Receiver, Context {

    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;

    MED public medToken;
    FP public fpToken;
    address _issuingBank;

    uint256 public sellFee;
    uint256 public withdrawFee;
    uint256 public totalFees;

    struct Offer {
        address _tokenOwner;
        uint256 _sellingPrice;
    }

    mapping (uint256 => Offer) private offers;
    EnumerableSet.UintSet private _tokenIds;

    modifier onlyIssuingBank() {
        require(
            _msgSender() == _issuingBank,
            "Only Issuing Bank is allowed to call this"
        );
        _;
    }

    constructor (uint256 sellFee_, uint256 withdrawFee_, address medToken_, address fpToken_) {
        _issuingBank = _msgSender();
        fpToken = FP(fpToken_);
        medToken = MED(medToken_);
        sellFee = sellFee_;
        withdrawFee = withdrawFee_;
    }

    function sell(uint256 tokenId_, uint256 price_) public virtual {
        require(fpToken.ownerOf(tokenId_) == _msgSender(), "You are not the owner of this token");
        require(price_ > sellFee, "Selling price must be greater than the marketplace fees");
        require(fpToken.getApproved(tokenId_) == address(this), "Prepare an allowance for the token in order to sell");
        fpToken.safeTransferFrom(_msgSender(), address(this), tokenId_);
        _tokenIds.add(tokenId_);
        offers[tokenId_] = Offer(_msgSender(), price_);
    }

    function withdraw(uint256 tokenId_) public virtual {
        require(_tokenIds.contains(tokenId_), "Token offer does not exist");
        Offer memory offer = offers[tokenId_];
        require(offer._tokenOwner == _msgSender(), "You are not the owner of this token");
        require(medToken.allowance(_msgSender(), address(this)) >= withdrawFee, "Prepare an allowance with the correct amount in order to withdraw");
        medToken.transferFrom(_msgSender(), address(this), withdrawFee);
        fpToken.safeTransferFrom(address(this), _msgSender(), tokenId_);
        _tokenIds.remove(tokenId_);
        totalFees = totalFees + withdrawFee;
    }

    function buy(uint256 tokenId_) public virtual {
        require(_tokenIds.contains(tokenId_), "Token offer does not exist");
        Offer memory offer = offers[tokenId_];
        require(medToken.allowance(_msgSender(), address(this)) >= offer._sellingPrice, "Prepare an allowance with the correct amount in order to buy");
        medToken.transferFrom(_msgSender(), address(this), offer._sellingPrice);
        medToken.transfer(offer._tokenOwner, offer._sellingPrice - sellFee);
        fpToken.safeTransferFrom(address(this), _msgSender(), tokenId_);
        _tokenIds.remove(tokenId_);
        totalFees = totalFees + sellFee;
    }

    function withdrawProfit() public virtual onlyIssuingBank {
        medToken.transfer(_issuingBank, totalFees);
        totalFees = 0;
    }

    function isToSell(uint256 tokenId) public virtual view returns (bool) {
        return _tokenIds.contains(tokenId);
    }

    function getTokenIdOffer(uint256 idx) public virtual view returns (uint256) {
        require(idx < _tokenIds.length(), "Idx overflow");
        return _tokenIds.at(idx);
    }

    function getOfferLength() public virtual view returns (uint256) {
        return _tokenIds.length();
    }

     function onERC721Received(address, address, uint256, bytes calldata) 
            pure external override returns (bytes4) { 
        return this.onERC721Received.selector;
     } 

}