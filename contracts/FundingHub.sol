pragma solidity ^0.4.6;
import "./Project.sol";

contract FundingHub {
	
	mapping (address => address) projects;
	address[] projectAddresses;

	function FundingHub() {

	}

	function createProject(address _owner, uint _askingAmount, uint _deadline) payable{
		//create new project
		address _projectAddress = new Project(_owner, _askingAmount, _deadline);
		projects[_owner] = _projectAddress;
		projectAddresses.push(_projectAddress);
	}

	function contribute(address _project) payable{
		Project(_project).fund.value(msg.value)(msg.sender);
	}

	function getProjects() constant returns (address[]){
		return projectAddresses;
	}
}
