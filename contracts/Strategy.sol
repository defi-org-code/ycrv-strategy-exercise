pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/yVault.sol";
import "../interfaces/Curve.sol";
import "../interfaces/Gauge.sol";
import "../interfaces/Uniswap.sol";

contract Strategy is ERC20 {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public constant ycrv = address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8);
    address public constant gauge = address(0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1);
    address public constant mintr = address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0);
    address public constant crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);
    address public constant uni = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address public constant weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // used for crv <> weth <> dai route
    address public constant dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    address public constant ydai = address(0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01);
    address public constant usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    address public constant yusdc = address(0xd6aD7a6750A7593E092a9B218d66C0A814a3436e);
    address public constant usdt = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    address public constant yusdt = address(0x83f798e925BcD4017Eb265844FDDAbb448f1707D);
    address public constant tusd = address(0x0000000000085d4780B73119b644AE5ecd22b376);
    address public constant ytusd = address(0x73a052500105205d34Daf004eAb301916DA8190f);
    address public constant curve = address(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51);

    address public owner;

    constructor()
        public
        ERC20(
            string(abi.encodePacked("defu ", ERC20(ycrv).name())),
            string(abi.encodePacked("d", ERC20(ycrv).symbol()))
        )
    {
        _setupDecimals(ERC20(ycrv).decimals());
        owner = msg.sender;
    }

    function ycrvInGauge() public view returns (uint256) {
        return Gauge(gauge).balanceOf(address(this));
    }

    function localYcrv() public view returns (uint256) {
        return IERC20(ycrv).balanceOf(address(this));
    }

    function totalYcrv() public view returns (uint256) {
        return localYcrv().add(ycrvInGauge());
    }

    function stakeLocalYcrvInGauge() public {
        uint256 _amount = localYcrv();
        if (_amount > 0) {
            IERC20(ycrv).safeApprove(gauge, 0);
            IERC20(ycrv).safeApprove(gauge, _amount);
            Gauge(gauge).deposit(_amount);
        }
    }

    function _depositY(
        address _baseToken,
        address _yToken,
        uint256 _amount
    ) internal returns (uint256) {
        if (_amount == 0) {
            return 0;
        }
        IERC20(_baseToken).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 _baseTokenAmount = IERC20(_baseToken).balanceOf(address(this));
        if (_baseTokenAmount > 0) {
            IERC20(_baseToken).safeApprove(_yToken, 0);
            IERC20(_baseToken).safeApprove(_yToken, _baseTokenAmount);
            yERC20(_yToken).deposit(_baseTokenAmount);
        }
        uint256 _yTokenAmount = IERC20(_yToken).balanceOf(address(this));
        if (_yTokenAmount > 0) {
            IERC20(_yToken).safeApprove(curve, 0);
            IERC20(_yToken).safeApprove(curve, _yTokenAmount);
        }
        return _yTokenAmount;
    }

    function deposit(
        uint256 _ycrvDeposit,
        uint256 _daiDeposit,
        uint256 _usdcDeposit,
        uint256 _usdtDeposit,
        uint256 _tusdDeposit
    ) public {
        uint256 _ycrvBefore = totalYcrv();
        if (_ycrvDeposit > 0) {
            IERC20(ycrv).safeTransferFrom(msg.sender, address(this), _ycrvDeposit);
        }
        uint256 _ydaiAmount = _depositY(dai, ydai, _daiDeposit);
        uint256 _yusdcAmount = _depositY(usdc, yusdc, _usdcDeposit);
        uint256 _yusdtAmount = _depositY(usdt, yusdt, _usdtDeposit);
        uint256 _ytusdAmount = _depositY(tusd, ytusd, _tusdDeposit);
        if (_ydaiAmount > 0 || _yusdcAmount > 0 || _yusdtAmount > 0 || _ytusdAmount > 0) {
            ICurveFi(curve).add_liquidity([_ydaiAmount, _yusdcAmount, _yusdtAmount, _ytusdAmount], 0);
        }
        uint256 _ycrvDiff = totalYcrv().sub(_ycrvBefore);
        uint256 shares = 0;
        if (totalSupply() == 0) {
            shares = _ycrvDiff;
        } else {
            shares = (_ycrvDiff.mul(totalSupply())).div(_ycrvBefore);
        }
        _mint(msg.sender, shares);
        stakeLocalYcrvInGauge();
    }

    function withdrawAll() external {
        withdraw(balanceOf(msg.sender));
    }

    function withdraw(uint256 _shares) public {
        uint256 repayYcrv = (totalYcrv().mul(_shares)).div(totalSupply());
        _burn(msg.sender, _shares);
        uint256 availableYcrv = localYcrv();
        if (repayYcrv > availableYcrv) {
            // availableYcrv is normally zero
            uint256 _unstakeFromGauge = repayYcrv.sub(availableYcrv);
            Gauge(gauge).withdraw(_unstakeFromGauge);
        }
        IERC20(ycrv).safeTransfer(msg.sender, repayYcrv);
    }

    function ycrvPerOneShare() public view returns (uint256) {
        return totalYcrv().mul(uint256(10)**decimals()).div(totalSupply());
    }

    function withdraw(IERC20 _asset) external returns (uint256 amount) {
        require(msg.sender == owner, "!owner");
        amount = _asset.balanceOf(address(this));
        _asset.safeTransfer(owner, amount);
    }

    function compound() public {
        Mintr(mintr).mint(gauge);
        uint256 _crvAmount = IERC20(crv).balanceOf(address(this));
        if (_crvAmount > 0) {
            IERC20(crv).safeApprove(uni, 0);
            IERC20(crv).safeApprove(uni, _crvAmount);
            address[] memory path = new address[](3);
            path[0] = crv;
            path[1] = weth;
            path[2] = dai;
            Uni(uni).swapExactTokensForTokens(_crvAmount, uint256(0), path, address(this), now.add(1800));
        }
        uint256 _daiAmount = IERC20(dai).balanceOf(address(this));
        if (_daiAmount > 0) {
            IERC20(dai).safeApprove(ydai, 0);
            IERC20(dai).safeApprove(ydai, _daiAmount);
            yERC20(ydai).deposit(_daiAmount);
        }
        uint256 _ydaiAmount = IERC20(ydai).balanceOf(address(this));
        if (_ydaiAmount > 0) {
            IERC20(ydai).safeApprove(curve, 0);
            IERC20(ydai).safeApprove(curve, _ydaiAmount);
            ICurveFi(curve).add_liquidity([_ydaiAmount, 0, 0, 0], 0);
        }
        stakeLocalYcrvInGauge();
    }
}
