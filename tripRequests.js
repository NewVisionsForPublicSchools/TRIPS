var dbString = PropertiesService.getScriptProperties().getProperty('DBSTRING');
var tripColumns = 'trip_id,requested_date,username,requested_by,trip_name,description,trip_date,cost_per_student,'
                + 'collector,total_cost,transportation,other_transport,destination,number_of_students,students';
var trackColumns = 'trip_id,status,queue'



function getTripActionItems(){
  
}



function submitNewTripRequest(formObj){
  var test, nextId, trip, studentsUrl, ripQuery, trackQuery;
  
  PropertiesService.getScriptProperties().setProperty('TEST', formObj)
  nextId = PropertiesService.getScriptProperties().getProperty('nextTrpId')
  trip = formObj;
  trip.timestamp = new Date();
  trip.username = Session.getActiveUser().getEmail();
  trip.id = "AMS4TRP" + nextId.toString();
//  studentsUrl = processStudentFile(trip).link || "www.example.com";
//  
//  tripQuery = 'INSERT INTO trip_requests(' + tripColumns + ') values("'
//              + trip.trip_id + '", "'
//              + trip.timestamp + '", "'
//              + trip.username + '", "'
//              + trip.requested_by + '", "'
//              + trip.trip_name + '", "'
//              + trip.description + '", "'
//              + trip.trip_date + '", "'
//              + trip.cost_per_student + '", "'
//              + trip.collector + '", "'
//              + trip.total_cost + '", "'
//              + trip.transportation + '", "'
//              + trip.other_transport + '", "'
//              + trip.destination + '", "'
//              + trip.number_of_students + '", "'
//              + studentsUrl + '")';
//  
//  trackQuery = 'INSERT INTO tracking(' + trackColumns + ') values("'
//               + trip.trip_id + '", "'
//               + "Active" + '", "'
//               + "AP" + '")';
//  
//  NVGAS.insertSqlRecord(dbString, [tripQuery, trackQuery]);
//  PropertiesService.getScriptProperties().setProperty('nextTrpId', (Number(nextId) + 1).toString());
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