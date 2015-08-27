var dbString = PropertiesService.getScriptProperties().getProperty('DBSTRING');



function getTripActionItems(){
  var test, queue, nr, tbf, html;
  
  queue = JSON.parse(getTripsByRole());
  nr = queue.filter(function(e){
    return (e.status == 'New') || (e.status =='Under Review');
  });

  tbf = queue.filter(function(e){
    return (e.status == 'Approved') || (e.status =='In Progress');
  });

  html = HtmlService.createTemplateFromFile('action_items');
  html.newClass = nr.length > 0 ? 'nvRed' : 'nvGreen';
  html.fulfillClass = tbf.length > 0 ? 'nvRed' : 'nvGreen';
  html.nr = nr.length;
  html.tbf = tbf.length;
  html.ur = getUserRole(PropertiesService.getUserProperties().getProperty('currentUser'));

  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function getTripsByRole(){
  var test, user, userQuery, roles, keys, requests;
  
//  user = 'approver2@charter.newvisions.org';
  user = PropertiesService.getUserProperties().getProperty('currentUser');;
  userQuery = 'SELECT roles FROM users WHERE username = "' + user + '"'; 
  roles = NVGAS.getSqlRecords(dbString, userQuery).map(function(e){
    return e.roles;
  });
 
  requests = JSON.stringify(roles.map(function(e){
    var query = 'SELECT * FROM trip_requests r INNER JOIN tracking t on r.trip_id = t.trip_id WHERE t.queue = "'
      + e + '"';
    return NVGAS.getSqlRecords(dbString, query);
  }).reduce(function(e){
    return e;
  }));

  CacheService.getUserCache().put('roleRequests', requests);
  return requests;
}



function loadNewTrips(){
  var test, queue, data, html;
  
  queue = JSON.parse(CacheService.getUserCache().get('roleRequests')) || getTripsByRole();
  data = queue.filter(function(e){
    return (e.status == 'New') || (e.status =='Under Review');
  });
  
  html = HtmlService.createTemplateFromFile('new_trips_table');
  html.data = data;
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function loadNewReqForm(trip_id){
  var test, html;
  
  html = HtmlService.createTemplateFromFile('process_new_trip_form');
  html.request = getTrip(trip_id);
  html.approver = PropertiesService.getUserProperties().getProperty('currentUser');;
  debugger;
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function processNewTrpApproval(formObj){
  var test, trip, approvalCol, queryArray, rQuery, aQuery, html, approverAlert, newQueue, status;
  
  trip = getTrip(formObj.trip_id);
  approvalCol = trip.queue == "AP" ? "ap_approval" : "dso_approval";
  newQueue = trip.queue == "AP" ? "DSO" : "BM";
  queryArray = [];
  rQuery = 'UPDATE tracking t SET t.justification = "' + formObj.justification + '", t.approver = "' + formObj.approver
           + '" WHERE t.trip_id = "' + formObj.trip_id + '"';
  queryArray.push(rQuery);
  
  switch(formObj.status){
    case 'Approved':
      status = newQueue == "DSO" ? "Under Review" : "Approved";
      aQuery = 'UPDATE tracking SET ' + approvalCol + ' = "' + new Date() + '", queue = "' + newQueue + '", status = "'
               + status + '" WHERE trip_id = "' + formObj.trip_id + '"';
      queryArray.push(aQuery);
      break;
      
    case 'Denied':
      aQuery = 'UPDATE tracking SET denial = "' + new Date() + '", queue = "", status = "Denied" WHERE trip_id = "' + formObj.trip_id + '"';
      queryArray.push(aQuery);
      break;
      
    default:
      break;
  }
 
  NVGAS.insertSqlRecord(dbString, queryArray);
  checkApprovalStatus(formObj);
  
  html = HtmlService.createTemplateFromFile('process_new_trip_confirmation');
  html.request = formObj.trip_id;
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function checkApprovalStatus(approvalObj){
  var test, status, trip, tripId, action, checklist, forward;
  
  trip = getTrip(approvalObj.trip_id);
  status = trip.status;
  tripId = trip.trip_id;
  
  switch (status){
    case 'Approved':
      action = trip.queue == "BM" ? sendApprovalEmail(trip) : null;
      checklist = trip.queue == "BM" ? createChecklist(trip) : null;
      forward = trip.queue == "BM" ? sendChecklist(trip) : null;
      break;
      
    case 'Denied':
      sendDenialEmail(trip);
      break;
      
    case 'Under Review':
      forwardToDso(trip);
      break;
      
    default:
      break;
  } 
}



function sendApprovalEmail(tripObj){
  var test, trip, recipient, subject, html, template, ccQuery, copyList;
  
  trip = getTrip(tripObj.trip_id);
  recipient = trip.username;
  subject = "DO NOT REPLY: Trip Request Approved | " + trip.trip_id;
  html = HtmlService.createTemplateFromFile('approval_email');
  html.request = trip;
  template = html.evaluate().getContent();
  ccQuery = 'SELECT username FROM users WHERE roles LIKE "%DSO%" OR roles LIKE "%AP%"';
  copyList = NVGAS.getSqlRecords(dbString, ccQuery).map(function(e){
    return e.username;
  }).join();
  
  GmailApp.sendEmail(recipient, subject,"",{htmlBody: template,
                                            cc: copyList});
}



function forwardToDso(tripObj){
  var test, request, recQuery, recipientList, subject, html, template, alertQuery, statusQuery;
  
  request = tripObj;
  recQuery = 'SELECT username FROM TRIPS.users WHERE roles LIKE "%DSO%"';
  recipientList = NVGAS.getSqlRecords(dbString, recQuery).map(function(e){
    return e.username;
  }).join();
  subject = request.trip_name + " | Trip Request Approval Needed | " + request.trip_id
  html = HtmlService.createTemplateFromFile('approver_alert_email');
  html.request = request;
  html.request.trip_date = new Date(request.trip_date).toLocaleDateString();
  html.request.requested_date = new Date(request.requested_date).toLocaleDateString();
  html.url = PropertiesService.getScriptProperties().getProperty('scriptUrl');
  template = html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();

  GmailApp.sendEmail(recipientList, subject,"",{htmlBody: template});
  
  alertQuery = 'UPDATE TRIPS.tracking SET dso_alert = "' + new Date() + '" WHERE trip_id = "' + request.trip_id + '"';
  NVGAS.updateSqlRecord(dbString, [alertQuery]);
  debugger;
}



function sendDenialEmail(trip){
  var test, request, recipient, subject, html, template, ccQuery, copyList;
  
  request = getTrip(trip.trip_id);
  recipient = request.username;
  subject = "DO NOT REPLY: Trip Request Denied | " + request.trip_id;
  html = HtmlService.createTemplateFromFile('denial_email');
  html.request = request;
  template = html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
  ccQuery = 'SELECT username FROM users WHERE roles LIKE "%DSO%" OR roles LIKE "%AP%"';
  copyList = NVGAS.getSqlRecords(dbString, ccQuery).map(function(e){
    return e.username;
  }).join();
  
  GmailApp.sendEmail(recipient, subject,"",{htmlBody: template,
                                            cc: copyList});
}



function sendCheckList(tripObj){
  var test, trip, recQuery, recipientList, subject, html, template, ccQuery, copyList;
  
  trip = getTrip(tripObj.trip_id);
  recQuery = 'SELECT username FROM TRIPS.users WHERE roles LIKE "%BM%"';
  recipientList = NVGAS.getSqlRecords(dbString, recQuery).map(function(e){
    return e.username;
  }).join();
  subject = "DO NOT REPLY: Trip Request Approved | " + trip.trip_id;
  html = HtmlService.createTemplateFromFile('new_checklist_alert_email');
  html.request = trip;
  html.url = PropertiesService.getScriptProperties().getProperty('scriptUrl');
  template = html.evaluate().getContent();
  
  GmailApp.sendEmail(recipientList, subject,"",{htmlBody: template});
}