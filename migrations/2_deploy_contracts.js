var FundingHub = artifacts.require("FundingHub.sol");
var Project = artifacts.require("Project.sol");
module.exports = function(deployer) {
  deployer.deploy(FundingHub).then(result => {
  	FundingHub.deployed().then(fundingHub => {
  		return fundingHub.createProject(web3.eth.accounts[3],100000000000000000,2883228800);
  	}).then(result => {
  		return deployer.deploy(Project, web3.eth.accounts[0],300000000000000000,  2883228800);
  	})
  });
  	
};
