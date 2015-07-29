var dbString = '//ga-sql-bootcamp:demodb0615/TRIPS';
var userColumns = 'username,roles';



function validateUser(){
  var test, currentUser, query, validUser;

  currentUser = Session.getActiveUser().getEmail();
//  currentUser = 'approver1@charter.newvisions.org';
  query = 'SELECT * FROM users WHERE username = "' + currentUser + '"';
  
  validUser = NVGAS.getSqlRecords(dbString, query)[0] ? NVGAS.getSqlRecords(dbString, query)[0].username : "";

  return validUser ? true : false;
}