// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC20/ERC20.sol";
import "../../utils/Counters.sol";

/**
 * @dev Implementation of the {ERC20} interface as a sovereign moroccan crypto-currency
 * @author AshtonIzmev
 */
contract MED is ERC20 {

    using Counters for Counters.Counter;

    address _centralBank;
    address _treasureAccount;

    mapping (address => uint256) private _lastDayTax;
    Counters.Counter public daysElapsed;
    uint32 public dailyTaxRate;

    mapping (address => uint256) private _lastMonthIncome;
    Counters.Counter public monthsElapsed;
    uint256 public universalMonthlyIncome;

    bool public allowMint = false;

    modifier onlyCentralBank() {
        require(
            _msgSender() == _centralBank,
            "Only Central Bank is allowed to call this"
        );
        _;
    } 

    /**
     * The treasure account is the "root" account on this currency
     * param annualTaxRatePercent : percentage of the account that would be taxed in a year
     *                              tax is applied daily
     * param umi : Universal Monthly Income
     * param allowMint : Should we allow central bank to mint new tokens ?
     */
    constructor (address treasureAccount, uint32 annualTaxRatePercent, uint256 umi, 
        bool allowMintArg, uint256 initialMint) ERC20("Moroccan E-Dirham", "MED") {
        _centralBank = _msgSender();
        _treasureAccount = treasureAccount;
        dailyTaxRate = annualTaxRatePercent * 10000 / 365;
        universalMonthlyIncome = umi;
        allowMint = allowMintArg;
        _mint(_treasureAccount, initialMint);
    }


    /**
     * MED cyrpto-currency only uses "cents" or "centimes" as a subdivision
     */
    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    function elapsedTaxDaysOf(address account) public view virtual returns (uint256) {
        return _lastDayTax[account];
    }

    function elapsedIncomeMonthOf(address account) public view virtual returns (uint256) {
        return _lastMonthIncome[account];
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _updateAccount(_msgSender());
        _updateAccount(recipient);
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function updateAccount(address taxPayer) public virtual {
        _updateAccount(taxPayer);
    }

    function mint(uint256 amount) public virtual onlyCentralBank {
        require(allowMint);
        _mint(_treasureAccount, amount);
    }

    function burn(uint256 amount) public virtual onlyCentralBank {
        _burn(_treasureAccount, amount);
    }

    function incrementDay() public virtual onlyCentralBank {
        daysElapsed.increment();
    }

    function incrementMonth() public virtual onlyCentralBank {
        monthsElapsed.increment();
    }

    function setNewDailyTaxRate(uint32 newRate) public virtual onlyCentralBank {
        dailyTaxRate = newRate;
    }

    function setNewBasicIncome(uint256 newIncome) public virtual onlyCentralBank {
        universalMonthlyIncome = newIncome;
    }
    
    /**
    *
    * * * * * * * * * * * * *
    * Internal functions    *
    * * * * * * * * * * * * *
    *
    */

    function _calculateIncome(address taxPayer) internal view virtual returns (uint256) {
        if (taxPayer == _treasureAccount) {
            return 0;
        }
        uint256 taxPayerMonthsElapsed = monthsElapsed.current() - _lastMonthIncome[taxPayer];
        if (taxPayerMonthsElapsed == 0) {
            return 0;
        }
        return taxPayerMonthsElapsed * universalMonthlyIncome;
    }

    function _calculateTax(address taxPayer) internal view virtual returns (uint256) {
        if (taxPayer == _treasureAccount) {
            return 0;
        }
        uint256 taxPayerdaysElapsed = daysElapsed.current() - _lastDayTax[taxPayer];
        if (taxPayerdaysElapsed == 0) {
            return 0;
        }
        uint256 taxToPay = balanceOf(taxPayer) * taxPayerdaysElapsed * dailyTaxRate / (1000 * 1000);
        return taxToPay;
    }

    function _updateAccount(address taxPayer) internal virtual{
        _transferIncome(taxPayer);
        _deductTax(taxPayer);
    }

    function _transferIncome(address taxPayer) internal virtual {
        uint256 umi = _calculateIncome(taxPayer);
        _lastMonthIncome[taxPayer] = monthsElapsed.current();
        _transfer(_treasureAccount, taxPayer, umi);
    }

    function _deductTax(address taxPayer) internal virtual {
        uint256 taxToPay = _calculateTax(taxPayer);
        _lastDayTax[taxPayer] = daysElapsed.current();
        _transfer(taxPayer, _treasureAccount, taxToPay);
    }
}
