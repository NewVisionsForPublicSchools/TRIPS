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
  html.approver = PropertiesService.getUserProperties().getProperty('currentUser');
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
}



function processList($formObj){
//  var test, status, request, query, queryArray, statusQuery, html;
//
//  queryArray = [];
//  status = tbfObj.status;
//  request = tbfObj.request_id;
//  query = 'UPDATE Tracking SET status = "' + status + '" WHERE request_id = "' + request + '"';
//  queryArray.push(query);
//  
//  switch(status){
//    case 'Ordered':
//      statusQuery = 'UPDATE Tracking SET ordered = "' + new Date() + '" WHERE request_id = "' + request + '"';
//      sendOrderedEmail(request);
//      break;
//      
//    case 'Received':
//      statusQuery = 'UPDATE Tracking SET received = "' + new Date() + '" WHERE request_id = "' + request + '"';
//      sendReceivedEmail(request);
//      break;
//      
//    case 'Fulfilled':
//      statusQuery = 'UPDATE Tracking SET fulfilled = "' + new Date() + '", queue = "" WHERE request_id = "' + request + '"';
//      sendFulfilledEmail(request);
//      break;
//      
//    default:
//      break;
}