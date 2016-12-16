//helper function to add a project to Browse Projects table
function addProjectRow(address, raised, requested, deadline) {
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
	$('#project-table').append(_html);
}

//TODO
//add create project logic
/*function createProject() {

	var project = {
		owner : $('.create-project-owner').val(),
		amount : $('.create-project-amount').val(),
		deadline : $('.create-project-deadline').val()
	}

	addProjectRow("project_address", 0,project.amount,project.deadline);

	console.log(project)
}

//TODO
//add contribute logic
function contribute() {
	var contribution = {
		project : $('.contribute-project-address').val(),
		amount : $('.contribute-project-amount').val()
	}

	console.log(contribution);
}*/
