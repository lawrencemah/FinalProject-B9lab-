pragma solidity ^0.4.4;
import "Project.sol";
contract FundingHub is Project{
address[] project_addr;
uint temp_num = 0; 


function CreateProject(bytes32 _project_name, uint _target,uint _deadline){
        Project child = (new Project).value(0)();
        child.pass(msg.sender,_project_name, _deadline ,_target , temp_num);
	project_addr.push(child);
        temp_num++;
}
function contribute(address _project, uint _amount){
	Project p = Project(_project);  
	p.fund(msg.sender, _amount);
}
function gettime()returns(uint){return(now);}
function getlist(uint v)returns(bytes32, address, uint,uint,uint,uint){

    return(Project(project_addr[v]).project_name(),project_addr[v],project_addr[v].balance,Project(project_addr[v]).target(),	Project(project_addr[v]).deadline(),	Project(project_addr[v]).statusid());
}

function getnopro()returns(uint){
    return temp_num;
}

}
