var accounts;
var account;
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider("http://127.0.0.1:8545"));

//var MyContract = require("../contracts/FundingHub.sol.js");
//MyContract.setProvider(web3.currentProvider);

/*
function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function refreshBalance() {
  var meta = MetaCoin.deployed();

  meta.getBalance.call(account, {from: account}).then(function(value) {
    var balance_element = document.getElementById("balance");
    balance_element.innerHTML = value.valueOf();
  }).catch(function(e) {
    console.log(e);
    setStatus("Error getting balance; see log.");
  });
};

function sendCoin() {
  var meta = MetaCoin.deployed();

  var amount = parseInt(document.getElementById("amount").value);
  var receiver = document.getElementById("receiver").value;

  setStatus("Initiating transaction... (please wait)");

  meta.sendCoin(receiver, amount, {from: account}).then(function() {
    setStatus("Transaction complete!");
    refreshBalance();
  }).catch(function(e) {
    console.log(e);
    setStatus("Error sending coin; see log.");
  });
};
*/


function create(){
var p_name="";
var p_value=document.getElementById("cre_amount").value;
var p_date1=document.getElementById("cre_date1").value;
var p_date2=document.getElementById("cre_date2").value-1;
var p_date3=document.getElementById("cre_date3").value;
var p_date = new Date(p_date1, p_date2, p_date3).getTime() / 1000;
  var meta = FundingHub.deployed();
	meta.CreateProject(p_name, p_value, p_date, {from: account, gas: 10000000});
}

function contribute(){
var p_address=document.getElementById("con_addr").value;
var p_value=document.getElementById("con_amount").value;
var i =0;
  var meta = FundingHub.deployed();

	 meta.getnopro.call({from: account}).then(function(value) {
    value = value.valueOf();

 while(i < value){	
meta.getlist.call(i, {from: account}).then(function(value1) {
     value1 = value1.valueOf();
if(value1[1]==p_address){
    var txn = web3.eth.sendTransaction({ 
        from: account, 
        to: p_address,
        value: p_value 
    });
while(value1[2]==web3.eth.getBalance(value1[1])){}
meta.contribute(p_address, p_value, {from: account, gas: 10000000});
}
});
i++;
}
  });
	

}

function listingout(){

  var meta = FundingHub.deployed();
  var i=0;
var value;
document.getElementById("list").innerHTML = "";
meta.gettime.call({from: account}).then(function(value) {
value=value.valueOf();
value=value*1000;
//alert(new Date(value));
}
);

	 meta.getnopro.call({from: account}).then(function(value) {
    value = value.valueOf();
//alert(value);
 while(i < value){	
meta.getlist.call(i, {from: account}).then(function(value1) {
    value1 = value1.valueOf();
//alert(value1);
	if(value1[5] ==1){document.getElementById("list").innerHTML = document.getElementById("list").innerHTML + '<div class="row full-width-row table-row"><div class="col-xs-6 cell">'+ value1[1] +'</div><div class="col-xs-2 cell">'+ value1[2] +'</div><div class="col-xs-2 cell">'+ value1[3] +'</div><div class="col-xs-2 cell">'+ new Date(value1[4]*1000) +'</div></div>';}


}
);
i++;
}
  });
}

window.onload = function() {
  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

    accounts = accs;
    account = accounts[0];
  });
}


