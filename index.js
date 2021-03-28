const {
  ChainId,
  Fetcher,
  WETH,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  Percent,
} = require("@uniswap/sdk");
const ethers = require("ethers");
const web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const abi = require("./abi.json");
const chainId = ChainId.RINKEBY;
const tokenAddress = "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea";
const init = async () => {
  const dai = await Fetcher.fetchTokenData(chainId, tokenAddress);
  const weth = WETH[chainId];
  const pair = await Fetcher.fetchPairData(dai, weth);
  const route = new Route([pair], weth);
  const trade = new Trade(
    route,
    new TokenAmount(weth, "1000000000000000000"),
    TradeType.EXACT_INPUT
  );
  console.log(route.midPrice.toSignificant(6));
  console.log(route.midPrice.invert().toSignificant(6));
  console.log(trade.executionPrice.toSignificant(6));
  console.log(trade.nextMidPrice.toSignificant(6));
  const slippageTolerance = new Percent("50", "10000");
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
  const path = [weth.address, dai.address];
  const to = "0x86bEF5C3c0c3C79bB5aEa65FDf1AdE4BA5ADe6E5";
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const value = trade.inputAmount.raw;

  const provider = ethers.getDefaultProvider("mainnet", {
    infura: "https://mainnet.infura.io/v3/1977e1bd2cbe44ed875e37e9e4ba0260",
  });
  //   let provider = new HDWalletProvider({
  //     mnemonic: {
  //       phrase: proccess.env.mnemonicPhrase,
  //     },
  //     providerOrUrl:
  //       "https://rinkeby.infura.io/v3/73b626ff98a04927af975ae0a4a4a019",
  //   });
  //   const web3 = new Web3(provider);
  const signer = new ethers.Wallet("8c5f3088b4b6465f8762c508a2cfbdfa");
  const account = signer.connect(provider);
  const uniswap = new ethers.Contract(
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    [
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);",
    ],
    account
  );
  //   const uniswap = await new web3.eth.Contract(abi);
  const tx = await uniswap.sendExactEthForTokens(
    amountOutMin,
    path,
    to,
    deadline,
    { value, gasPrice: 20e9 }
  );
  console.log("TX hash", tx.hash);
  const receipt = await tx.wait();
  console.log(receipt);
};

init();
