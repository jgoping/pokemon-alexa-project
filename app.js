const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const app = express();
const Alexa = require('ask-sdk-core');
const skillBuilder = Alexa.SkillBuilders.custom();

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

app.post('/', adapter.getRequestHandlers());

app.listen(80, () => {
  console.log('Listening...')
});
