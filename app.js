const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const app = express();
const Alexa = require('ask-sdk-core');
const skillBuilder = Alexa.SkillBuilders.custom();

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const say = 'Welcome to the Pokemon Info skill! What would you like to know?';

        return handlerInput.responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

skillBuilder.addRequestHandlers(
    LaunchRequestHandler,
);

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

app.post('/', adapter.getRequestHandlers());

app.listen(80, () => {
  console.log('Listening...')
});
