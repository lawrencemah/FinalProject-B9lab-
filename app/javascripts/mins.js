// ~/DAPPS/faucet_barebone/app/faucet.js
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}
console.log("Coinbase: " + web3.eth.coinbase);

// Your deployed address changes every time you deploy.

// Query eth for balance
console.log("Contract balance: " + web3.eth.getBalance(faucetAddress));
console.log("Contract balance: " + web3.eth.getBalance(faucetAddress1));

function fund(p_address , p_amount){
    var txn = project.contribute(
        p_address, p_amount,
        {from: web3.eth.coinbase});
    console.log("Fund Project");
}

function create(p_address , p_amount , p_date){
    var txn = fundinghub.createProject(
        p_address, p_amount,
        {from: web3.eth.coinbase});
    console.log("Create Project");
}

--unlock

sudo geth --datadir ~/.ethereum/net42 --networkid 42 --rpc --rpcport 8545 --rpcaddr 0.0.0.0 --rpccorsdomain "*" --rpcapi "eth,web3,personal" --unlock "0xfb3045eff78e1d2b1a81253e292b8ee9dc090cbb"
 --password pw console

