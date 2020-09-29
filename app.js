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

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const say = `You can ask me about a variety of Pokemon and the following traits about them:
        type, height, weight. An example question could be: "Tell me about Jigglypuff". You can also ask
        about the type match-up between two pokemon, which could look like: "How effective is Bulbasaur
        against Squirtle?". So what would you like to know?`;

        return handlerInput.responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

skillBuilder.addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
);

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

app.post('/', adapter.getRequestHandlers());

app.listen(80, () => {
  console.log('Listening...')
});
