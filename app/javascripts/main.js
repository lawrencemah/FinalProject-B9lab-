var accounts;
var account;
var fundingHub;

//helper function to add a project to Browse Projects table
function addProjectRow(address, raised, requested, deadline) {
	//if (deadline < (Date.now()/1000))
	//	return;
	if (deadline == "Deadline"){
		var _html = '<div class="row full-width-row table-row">\
						<div class="col-xs-6 cell">' +
						address +
						'</div>\
						<div class="col-xs-2 cell">' +
						raised + 
						'</div>\
						<div class="col-xs-2 cell">' +
						requested + 
						'</div>\
						<div class="col-xs-2 cell">' + 
						deadline +
						'</div>\
					</div>';
	}


	else {
		var deadlineDate = moment.unix(deadline);
		var _html = '<div class="row full-width-row table-row">\
						<div class="col-xs-6 cell">' +
						address +
						'</div>\
						<div class="col-xs-2 cell">' +
						raised + 
						'</div>\
						<div class="col-xs-2 cell">' +
						requested + 
						'</div>\
						<div class="col-xs-2 cell">' + 
						deadlineDate.format('YYYY-MM-DD HH:mm') +
						'</div>\
					</div>';
	}
	$('#project-table').append(_html);
}

//TODO
//add create project logic
function createProject() {
	var deadlineUnix = moment($('.create-project-deadline').val()).unix();

	var project = {
		owner : $('.create-project-owner').val(),
		amount : $('.create-project-amount').val(),
		deadline : deadlineUnix
	}

	console.log(project);

	fundingHub.createProject(project.owner, project.amount, project.deadline,{from : account, gas:600000})
	.then(function() {
		//trasaction complete
		refreshProjects();
		clearInputFields();
	})

}

function clearInputFields() {
	//create project
	$('.create-project-owner').val('');
	$('.create-project-amount').val('');
	$('.create-project-deadline').val('');

	//contribute tt project
	$('.contribute-project-address').val('');
	$('.contribute-project-amount').val('');
}

function contribute() {
	var contribution = {
		project : $('.contribute-project-address').val(),
		amount : $('.contribute-project-amount').val()
	}

	fundingHub.contribute(contribution.project,{from : web3.eth.accounts[0], value : contribution.amount, gas:10000000})
	.then(function (){
		refreshProjects();
		clearInputFields();
	});
}

function emptyProjectTable() {
	$('#project-table').empty();
	addProjectRow('Project Address', 'Wei Raised', 'Wei Requested', 'Deadline')

}

function refreshProjects() {
	//delete previous projects
	emptyProjectTable();

	fundingHub.getProjects().then(function (projects) {
		console.log(projects);
		for (i=0;i<projects.length;i++){
			getProjectDetails(projects[i], function(project){
				console.log(project);
				//addProjectRow 
				addProjectRow(project.address,project.raised,project.requested,project.deadline);
			});
		}
	});
}

function getProjectDetails(address, cb) {
	Project.at(address).then(project => {
		var thisProject = {};
		thisProject.address = address;
		thisProject.raised = web3.toDecimal(web3.eth.getBalance(address));
		project.thisProject().then(function(_project){
			//console.log("PROJECT : " + _project[1]);
			//index 1 = request amount
			//index 2 = deadline
			thisProject.requested = web3.toDecimal(_project[1]);
			thisProject.deadline = web3.toDecimal(_project[2]);
			cb(thisProject);
			return null
		});
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
    web3.eth.defaultAccount = account;
    fundingHub = "";
    FundingHub.deployed().then(instance => {
    	fundingHub = instance;
    	refreshProjects();
    });

    
  });
}