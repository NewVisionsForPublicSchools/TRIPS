var dbString = PropertiesService.getScriptProperties().getProperty('DBSTRING');



function getTripActionItems(){
  var test, queue, nr, tbf, html;
  
  queue = JSON.parse(getTripsByRole());
  nr = queue.filter(function(e){
    return (e.status == 'New') || (e.status =='Under Review');
  });

  tbf = queue.filter(function(e){
    return (e.status == 'Approved') || (e.status =='Ordered') || (e.status =='Received');
  });

  html = HtmlService.createTemplateFromFile('action_items');
  html.newClass = nr.length > 0 ? 'nvRed' : 'nvGreen';
  html.fulfillClass = tbf.length > 0 ? 'nvRed' : 'nvGreen';
  html.nr = nr.length;
  html.tbf = tbf.length;
  html.role = queue[0].queue;

  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function getTripsByRole(){
  var test, user, userQuery, roles, keys, requests;
  
//  user = 'approver1@newvisions.org';
  user = Session.getActiveUser().getEmail();
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
  html.approver = Session.getActiveUser().getEmail();
  debugger;
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function processNewTrpApproval(formObj){
  var test, queryArray, rQuery, aQuery, html, approverAlert, newQueue;
  
  queryArray = [];
  rQuery = 'UPDATE tracking t SET t.status = "' + formObj.status
           + '", t.justification = "' + formObj.justification + '", t.approver = "' + formObj.approver
           + '" WHERE t.trip_id = "' + formObj.trip_id + '"';
  queryArray.push(rQuery);
  
  switch(formObj.status){
    case 'Approved':
      aQuery = 'UPDATE tracking SET ap_approval = "' + new Date() + '", queue = "DSO" WHERE trip_id = "' + formObj.trip_id + '"';
      queryArray.push(aQuery);
      break;
      
    case 'Denied':
      aQuery = 'UPDATE tracking SET denial = "' + new Date() + '", queue = "" WHERE trip_id = "' + formObj.trip_id + '"';
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
//  var test, status, trip;
//  
//  status = approvalObj.status;
//  trip = approvalObj.trip_id;
//  
//  switch (status){
//    case 'Approved':
//      sendApprovalEmail(request);
//      break;
//      
//    case 'Denied':
//      sendDenialEmail(request);
//      break;
//      
//    default:
//      break;
//  } 
}



function sendApprovalEmail(trip_id){
  var test, trip, recipient, subject, html, template, ccQuery, copyList;
  
  trip = getTrip(trip_id);
  recipient = trip.username;
  subject = "DO NOT REPLY: Supply Request Approved | " + request.request_id;
  html = HtmlService.createTemplateFromFile('approval_email');
  html.request = request;
  template = html.evaluate().getContent();
  ccQuery = 'SELECT username FROM users WHERE roles LIKE "%DSO%" OR roles LIKE "%BM%"';
  copyList = NVGAS.getSqlRecords(dbString, ccQuery).map(function(e){
    return e.username;
  }).join();
  
  GmailApp.sendEmail(recipient, subject,"",{htmlBody: template,
                                            cc: copyList});
}