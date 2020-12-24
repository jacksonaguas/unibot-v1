const { ChainId, Fetcher, Route, Trade, TokenAmount, TradeType, Percent, WETH } = require('@uniswap/sdk');
const ethers = require('ethers');

const chainId = ChainId.MAINNET;
const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

const init = async () => {

    // instance of Wrapped ETH smart contract
    const weth = WETH[chainId];

    // instance of DAI smart contract
    const dai = await Fetcher.fetchTokenData(chainId, tokenAddress);

    // weth/dai pair object
    const pair = await Fetcher.fetchPairData(weth, dai);

    // route for specified pair w/ input token WETH
    const route = new Route([pair],weth);
    console.log('\nTOKEN INFO');
    console.log('DAI/WETH: \t' + route.midPrice.toSignificant(6));
    console.log('WETH/DAI: \t' + route.midPrice.invert().toSignificant(6));

    // trade for specified route w/ input token amount of 0.001 weth
    const trade = new Trade(route, new TokenAmount(weth, '1000000000000000'), TradeType.EXACT_INPUT);
    console.log('\nTRADE INFO');
    console.log('Execution Price: \t' + trade.executionPrice.toSignificant(6) + ' dai');
    console.log('Next Mid Price: \t' + trade.nextMidPrice.toSignificant(6) + ' dai\n');

    // sets params for the transaction
    const slippageTolerance = new Percent('50', '10000') // 50 bips (1 bip = 0.000 1%) 
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const path = [weth.address, dai.address];
    const to = '';
    const deadline = Math.floor(Date.now()/1000) + 60*20
    const value = trade.inputAmount.raw;

    // sets the infura provider instead of running on our own ETH node
    const provider = ethers.getDefaultProvider('mainnet', {
        infura: 'infura_url'
    });

    // sets objects needed for transaction
    const signer = new ethers.Wallet(PRIVATE_KEY);
    const account = signer.connect(provider);
    const uniswap = new ethers.Contract(
        'ROUTER-V2-ADDRESS',
        ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);'],
        account
    );

    const txn = await uniswap.sendExactETHForTokens(
        amountOutMin,
        path,
        deadline,
        {
            value, gasPrice: 100e9 
        }
    );
    console.log('Transaction hash: ' + txn.hash);

    const receipt= await txn.wait();
        console.log('Transaction was mined in block '  + receipt.blockNumber);
}

init();