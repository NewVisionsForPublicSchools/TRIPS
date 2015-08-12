var dbString = PropertiesService.getScriptProperties().getProperty('DBSTRING');
var userColumns = 'username,roles';



function getCurrentUser(){
  var test, user;
  
  user = Session.getActiveUser().getEmail();
  
  if(user){
    setCurrentUser(user);
    return true;
  }
  else{
    return false;
  }
}



function validateUser(){
  var test, CURRENTUSER, query, validUser;

  CURRENTUSER = PropertiesService.getUserProperties().getProperty('currentUser');
  query = 'SELECT * FROM users WHERE username = "' + CURRENTUSER + '"';
  
  validUser = NVGAS.getSqlRecords(dbString, query)[0] ? NVGAS.getSqlRecords(dbString, query)[0].username : "";

  return validUser ? true : false;
}



function setCurrentUser(email){
  PropertiesService.getUserProperties().setProperty('currentUser', email);
}