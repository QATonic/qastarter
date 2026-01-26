const allure = require('allure-jest');
console.log('Type of allure:', typeof allure);
console.log('Keys:', Object.keys(allure));
try {
  new allure();
  console.log('Default is constructor');
} catch (e) {
  console.log('Default is NOT constructor');
}
if (allure.AllureReporter) {
  console.log('Has AllureReporter');
}
