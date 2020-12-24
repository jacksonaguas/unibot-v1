const { ChainId, Fetcher, Route, Trade, TokenAmount, TradeType, Percent, WETH } = require('@uniswap/sdk');
const ethers = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

const chainId = ChainId.GÖRLI;
const tokenAddress = '0x7af963cF6D228E564e2A0aA0DdBF06210B38615D';  // test token contract address on Gorli testnet

const init = async () => {

    // instance of Wrapped ETH smart contract
    const weth = WETH[chainId];

    // instance of TEST smart contract
    const test = await Fetcher.fetchTokenData(chainId, tokenAddress);

    // console.log(weth);
    test.symbol = 'TEST';
    test.name = 'Goerli Test Token'
    // console.log(test);

    // weth/dai pair object
    const pair = await Fetcher.fetchPairData(weth, test);

    // route for specified pair w/ input token WETH
    const route = new Route([pair],weth);
    console.log('\nTOKEN INFO');
    console.log('TEST/WETH: \t' + route.midPrice.toSignificant(6));
    console.log('WETH/TEST: \t' + route.midPrice.invert().toSignificant(6));

    // trade for specified route w/ input token amount of 0.001 weth
    const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT);
    console.log('\nTRADE INFO');
    console.log('Execution Price: \t' + trade.executionPrice.toSignificant(6) + ' test tokens');
    console.log('Next Mid Price: \t' + trade.nextMidPrice.toSignificant(6) + ' test tokens\n');

    // sets params for the transaction
    const slippageTolerance = new Percent('50', '10000') // 50 bips (1 bip = 0.000 1%) 
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const path = [weth.address, test.address];
    const to = process.env.RECIPIENT_ADDRESS;
    const deadline = Math.floor(Date.now()/1000) + 60*20
    const val = trade.inputAmount.raw;

    // sets the infura provider instead of running on our own ETH node
    const provider = ethers.getDefaultProvider('goerli', {
        infura: process.env.INFURA_URL
    });

    // sets objects needed for transaction
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY);
    const account = signer.connect(provider);
    const uniswap = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',    // Address of UniswapV2Router02
        ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
        account
    );

    // // sends txn to blockchain
    // console.log('amountOutMin: ' + amountOutMin);
    // console.log('path: ' + path);
    // console.log('to: ' + to);
    // console.log('deadline: ' + deadline);
    // const options =  {value: toString(val) , gasPrice: toString(50000000000)};
    // console.log(options.value);
    // options.value.sign = true;
    // console.log(options.value);

    // console.log(typeof(val.toString()))
    // console.log(ethers.BigNumber(val.toString()))

    // const txn = await uniswap.swapExactETHForTokens(
    //     amountOutMin,
    //     path,
    //     to,
    //     deadline,
    //     options
    // );

    // console.log('\nTRANSACTION INFO:')
    // console.log('Transaction hash: ' + txn.hash);
    // const receipt= await txn.wait();
    // console.log('Transaction was mined in block '  + receipt.blockNumber);
}

init();