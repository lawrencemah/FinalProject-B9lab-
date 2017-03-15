pragma solidity ^0.4.6;
contract Project {

	struct project {
		address owner;
		uint askingAmount;
		uint deadline;
	}

	mapping (address => uint) contributions;
	address[] contributors;
	project public thisProject;

	function Project(address _owner, uint _askingAmount, uint _deadline) {
		thisProject.owner = _owner;
		thisProject.askingAmount = _askingAmount;
		thisProject.deadline = _deadline;
	}

	function fund(address _contributor) payable {
		//track contribution
		//if contributor has not contributed before
		if (contributions[_contributor] == 0) {
			contributors.push(_contributor);
		}
		contributions[_contributor] += msg.value;

		
		//if asking amount reached
		// -> refund current transaction and payout funds
		if (this.balance >= thisProject.askingAmount) {
			payout();
			return;
		}
		
		//if deadline is passed
		// -> refund all funds
		if (now> thisProject.deadline) {
			refund();
			return;
		}
		
		
	}

	function getContributors() constant returns(address[]){
		return contributors;
	}

	function getContribution(address _contributor) constant returns(uint){
		return contributions[_contributor];
	}

	function payout() {
		if (!thisProject.owner.send(this.balance))
			throw;
			thisProject.deadline = 0;
	}

	function refund() {
		for (uint i = 0; i < contributors.length; i++){
			address contributor = contributors[i];
			if (!contributor.send(contributions[contributor]))
				throw;
		}
		thisProject.deadline=0;
	}
}
