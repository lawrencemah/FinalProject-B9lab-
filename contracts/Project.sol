pragma solidity ^0.4.4;
contract Project{
function Project() payable{}   
    address public  owner;
    bytes32 public project_name;
    uint public target;
    uint public deadline;
    uint public id;
    uint public statusid;
    address public contractadd;


struct contributor{
    uint id;
    address user;
    uint amount;
}
mapping(uint=>contributor) con; 

function idcall()returns(uint){
    return id;
}

function pass(address _owner,bytes32 _project_name, uint _deadline, uint _target, uint _id){
   target=_target;
   owner=_owner;
   project_name = _project_name;
   contractadd=this;
    deadline=_deadline;
   id=_id;
   statusid = 1;
}

uint b=0;
uint currentbal = this.balance;
function fund(address _msg, uint _amount){

    con[b].id = b;
    con[b].user=_msg;
    con[b].amount=_amount;
statusid=4;
   if(now > deadline)
    {   
refund();

    statusid=2;
    }
    else if(this.balance>=target)
    {
   statusid=3;
    uint extramoney = this.balance - target;
    bool result1 = _msg.send(extramoney);
    bool result2 = owner.send(this.balance);
 

    }
    b++;
}

function refund() {
    uint x=0;
    while (x<=b){
            bool result = con[x].user.send(con[x].amount);
        x++;
    }
   
}
function () payable {}

}
