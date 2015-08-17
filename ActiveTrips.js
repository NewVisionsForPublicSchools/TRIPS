var dbString = PropertiesService.getScriptProperties().getProperty('DBSTRING');



function loadActiveTrips(){
  var test, queue, data, html;
  
  queue = JSON.parse(CacheService.getUserCache().get('roleRequests'))
  data = queue.filter(function(e){
    return (e.status == 'Approved') || (e.status =='In Progress');
  });
  
  html = HtmlService.createTemplateFromFile('active_trips_table');
  html.data = data;
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function loadActiveForm(trip_id){
  var test, html;
  html = HtmlService.createTemplateFromFile('active_form');
  html.request = getTrip(trip_id);
  html.cl = getChecklist(trip_id);
  html.approver = PropertiesService.getUserProperties().getProperty('currentUser');
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function processList(listObj){
  var test, status, trip, approver, cl, query, queryArray, statusQuery, qa, html;

  queryArray = [];
  status = listObj.status;
  trip = listObj.trip_id;
  approver = listObj.approver;
  cl = getChecklist(trip);
  statusQuery = 'UPDATE tracking SET status = "' + status + '" WHERE trip_id = "' + trip + '"';
  queryArray.push(statusQuery);
  
  switch(status){
    case 'Completed':
      queryArray[queryArray.length] = 'UPDATE tracking SET queue = "", completion = "' + new Date() + '" WHERE trip_id = "' + trip + '"';
//      sendOrderedEmail(request);
      break;
      
    case 'In Progress':
//      sendReceivedEmail(request);
      break;
     
    default:
      break;
  }
  
  queryArray[queryArray.length] = (cl.lunches == null) && (listObj.lunches == true) ? 'UPDATE checklists SET lunches = "Completed by ' + approver + ' on ' + new Date() + '" WHERE trip_id = "' + trip + '"' : "remove";
  queryArray[queryArray.length] = (cl.bus_reservation == null) && (listObj.bus_reservation == true) ? 'UPDATE checklists SET bus_reservation = "Completed by ' + approver + ' on ' + new Date() + '" WHERE trip_id = "' + trip + '"' : "remove";
  queryArray[queryArray.length] = (cl.train_pass == null) && (listObj.train_pass == true) ? 'UPDATE checklists SET train_pass = "Completed by ' + approver + ' on ' + new Date() + '" WHERE trip_id = "' + trip + '"' : "remove";
  queryArray[queryArray.length] = (cl.slip_approval == null) && (listObj.slip_approval == true) ? 'UPDATE checklists SET slip_approval = "Completed by ' + approver + ' on ' + new Date() + '" WHERE trip_id = "' + trip + '"' : "remove";
  queryArray[queryArray.length] = (cl.slip_distribution == null) && (listObj.slip_distribution ==true) ? 'UPDATE checklists SET slip_distribution = "Completed by ' + approver + ' on ' + new Date() + '" WHERE trip_id = "' + trip + '"' : "remove";
  queryArray[queryArray.length] = (cl.consent_form == null) && (listObj.consent_form ==true) ? 'UPDATE checklists SET consent_form = "Completed by ' + approver + ' on ' + new Date() + '" WHERE trip_id = "' + trip + '"' : "remove";
  
  qa = queryArray.filter(function(e){
    return e != "remove";
  });
                         
  NVGAS.insertSqlRecord(dbString, qa);
  
  html = HtmlService.createTemplateFromFile('active_trip_confirmation');
  html.request = trip;
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function getChecklist(trip_id){
  var test, query, data;
  
  query = 'SELECT * FROM checklists WHERE trip_id = "' + trip_id + '"'
  data = NVGAS.getSqlRecords(dbString, query)[0];
  
  return data;
}



function createChecklist(trip_id){
  var test, query;
  
  query = 'INSERT INTO checklists(trip_id) VALUES("' + trip_id + '")'
  NVGAS.insertSqlRecord(dbString, [query])
}



function checkListReminder(){
  var test, query, trips;
  
  query = 'SELECT * FROM trip_requests r INNER JOIN tracking t ON r.trip_id = t.trip_id INNER JOIN checklists c ON r.trip_id = c.trip_id WHERE t.queue = "BM"';
  trips = NVGAS.getSqlRecords(dbString, query);
  
  trips.forEach(function(e){
    var tripDate = new Date(e.trip_date).getTime();
//    var currDate = new Date().getTime();
    var currDate = new Date("2015","11","10").getTime();
    if((tripDate - currDate) < 2.592e+8){
      sendChecklistReminder(e);
    }
    return;
  });
  debugger;
}



function sendChecklistReminder(tripObj){
  var test, trip, recQuery, recipientList, subject, html, template, ccQuery, copyList;
  
  trip = tripObj;
  recQuery = 'SELECT username FROM TRIPS.users WHERE roles LIKE "%BM%"';
  recipientList = NVGAS.getSqlRecords(dbString, recQuery).map(function(e){
    return e.username;
  }).join();
  subject = "DO NOT REPLY: Trip Checklist Not Completed | " + trip.trip_id;
  html = HtmlService.createTemplateFromFile('checklist_reminder_email');
  html.request = trip;
  html.url = PropertiesService.getScriptProperties().getProperty('scriptUrl');
  template = html.evaluate().getContent();
  
  GmailApp.sendEmail(recipientList, subject,"",{htmlBody: template});
}