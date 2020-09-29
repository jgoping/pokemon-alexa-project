const express = require('express');
const app = express();

app.post('/', adapter.getRequestHandlers());

app.listen(80, () => {
  console.log('Listening...')
});
