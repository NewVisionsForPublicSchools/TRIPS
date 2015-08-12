var dbString = PropertiesService.getScriptProperties().getProperty('DBSTRING');
var tripColumns = 'trip_id,requested_date,username,requested_by,trip_name,description,trip_date,cost_per_student,'
                + 'collector,total_cost,transportation,other_transport,destination,number_of_students,students';
var trackColumns = 'trip_id,status,queue';



function submitNewTripRequest(formObj){
  var test, nextId, trip, studentsUrl, ripQuery, trackQuery, html;
  
  nextId = PropertiesService.getScriptProperties().getProperty('nextTrpId');
  trip = formObj;
  trip.requested_date = new Date();
  trip.username = PropertiesService.getUserProperties().getProperty('currentUser');;
  trip.id = "AMS4TRP" + nextId.toString();
  trip.trip_date = new Date(trip.trip_date.split("-")[0],trip.trip_date.split("-")[1]-1,trip.trip_date.split("-")[2]);
  
  tripQuery = 'INSERT INTO trip_requests(' + tripColumns + ') values("'
              + trip.id + '", "'
              + trip.requested_date + '", "'
              + trip.username + '", "'
              + trip.requested_by + '", "'
              + trip.trip_name + '", "'
              + trip.description + '", "'
              + trip.trip_date + '", "'
              + trip.cost_per_student+ '", "'
              + trip.collector + '", "'
              + trip.total_cost + '", "'
              + trip.transportation + '", "'
              + trip.other_transportation + '", "'
              + trip.destination + '", "'
              + trip.number_of_students + '", "'
              + trip.students + '")';
  
  trackQuery = 'INSERT INTO tracking(' + trackColumns + ') values("'
               + trip.id + '", "'
               + "New" + '", "'
               + "AP" + '")';
  
  NVGAS.insertSqlRecord(dbString, [tripQuery, trackQuery]);
  PropertiesService.getScriptProperties().setProperty('nextTrpId', (Number(nextId) + 1).toString());
  Utilities.sleep(500);
  sendApAlert(trip);
  
  html = HtmlService.createTemplateFromFile('confirm_trip_submission');
  html.trip = trip;
  
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
  debugger;
}



function processStudentFile(tripObj){
  var test, blob, parentFolder, tripFolderName, tripFolder, file, newFile, students;
  
  blob = tripObj.trpStudents;
  parentFolder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('studentFileFolder'));
  tripFolderName = tripObj.trip_id;
  tripFolder = parentFolder.createFolder(tripFolderName);
  file = DriveApp.createFile(blob);
  newFile = file.makeCopy(tripFolder);
  file.setTrashed(true);
  students.name = folderName;
  students.link = folder.getUrl();
  students.id = folder.getId(); 
  return students;
}



function sendApAlert(request){
  var test, recQuery, recipientList, subject, html, template, alertQuery, statusQuery;
  
  recQuery = 'SELECT username FROM TRIPS.users WHERE roles LIKE "%AP%"';
  recipientList = NVGAS.getSqlRecords(dbString, recQuery).map(function(e){
    return e.username;
  }).join();
  subject = request.trip_name + " | Trip Request Submitted | " + request.id
  html = HtmlService.createTemplateFromFile('approver_alert_email');
  html.request = request;
  html.request.trip_date = new Date(request.trip_date).toLocaleDateString();
  html.request.requested_date = request.requested_date.toLocaleDateString();
  html.url = PropertiesService.getScriptProperties().getProperty('scriptUrl');
  template = html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();

  GmailApp.sendEmail(recipientList, subject,"",{htmlBody: template});
  
  alertQuery = 'UPDATE TRIPS.tracking SET ap_alert = "' + new Date() + '" WHERE trip_id = "' + request.id + '"';
  NVGAS.updateSqlRecord(dbString, [alertQuery]);
 
}



function getTrip(trip_id){
  var test, query, trip;
  
  query = 'SELECT * FROM trip_requests r INNER JOIN tracking t ON r.trip_id = t.trip_id WHERE r.trip_id = "'
          + trip_id + '"';
  trip = NVGAS.getSqlRecords(dbString, query)[0];
  
  return trip;
}