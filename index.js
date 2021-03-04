const { default: app } = require('./app/app.js');

const port = 8099;

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
