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