contract('FundingHub', function(accounts) {
  it("test refund", function() {
  var meta = FundingHub.deployed();
    var account = web3.eth.coinbase;
var balance1;
var proaddr;
var status1;
return meta.CreateProject("", 50, 1, {from: account, gas: 10000000}).then(function(){

return meta.getlist.call(0, {from: account}).then(function(value1){

return meta.contribute(value1[1], 0, {from: account, gas: 10000000}).then(function(){

return meta.getlist.call(0, {from: account}).then(function(value2){

assert.equal(value2[5], 2, "Refund Status Incorrect, Should be 2! But it is " + value2[5] + " now! ");

});
});
});
});
});

});
