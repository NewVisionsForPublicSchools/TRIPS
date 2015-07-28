var PAGETITLE = PropertiesService.getScriptProperties().getProperty('pageTitle');



function doGet() {
  return HtmlService
      .createTemplateFromFile('index')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle(PAGETITLE);
}



function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .getContent();
}



function getOAuthToken() {
  DriveApp.getRootFolder();
  return ScriptApp.getOAuthToken();
}



function getDevKey(){
  var test, devKey;
  PropertiesService.getScriptProperties().setProperty('testKey', 'Working');
  devKey = PropertiesService.getScriptProperties().getProperty('devKey');
  PropertiesService.getScriptProperties().setProperty('testKey', devKey);
  return devKey;
}