// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC721/ERC721.sol";
import "../../utils/Counters.sol";

/**
 * @title NFT representing a share of a finance product (term deposit, crowdunfing, investment etc.)
 * @author AshtonIzmev
 */
contract FP is ERC721 {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenCounter;

    // 0 is DAT (term deposit)
    // 1 is Factoring
    // 2 is Mudaraba
    // Not using enum because list may grow (is there a better way ?)
    mapping (uint256 => uint16) private _subscriptionKinds;

    address public issuingBank;

    modifier onlyIssuingBank() { 
        require(_msgSender() == issuingBank, "Only the issuingBank is allowed to call this");
        _;
    }

    constructor(string memory name_, string memory symbol_) 
        ERC721(name_, symbol_) {
            issuingBank = _msgSender();
    }

    function _baseURI() internal virtual pure override returns (string memory) {
        return "https://curieux.ma/";
    }

    function getCurrentTokenId() public virtual view returns (uint256) {
        return _tokenCounter.current();
    }

    function getKind(uint256 tokenId) public virtual view returns (uint16) {
        return _subscriptionKinds[tokenId];
    }

    function create(address buyer, uint16 kind_) public virtual {
        require(isApprovedForAll(issuingBank, _msgSender()), "Approved for all operator only");
        _tokenCounter.increment();
        _safeMint(buyer, _tokenCounter.current());
        _subscriptionKinds[_tokenCounter.current()] = kind_;
    }

    function destroy(uint256 tokenId) public virtual {
        require(isApprovedForAll(issuingBank, _msgSender()), "Approved for all operator only");
        _burn(tokenId);
    }

}