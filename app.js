const {checkForNewEmails} = require('./emailChecker');

setInterval(async () => {
  await checkForNewEmails();
}, randomInterval(45000, 120000));
