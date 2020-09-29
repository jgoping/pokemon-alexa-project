const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const axios = require('axios');

const app = express();
const Alexa = require('ask-sdk-core');
const skillBuilder = Alexa.SkillBuilders.custom();

// Function used to make the get request to the Pokemon API
const getPokemonData = async (pokemon) => {
    return axios.get('http://pokeapi.co/api/v2/pokemon/' + pokemon).then((res) => {
        const types = res.data.types;
        const height = res.data.height;
        const weight = res.data.weight;
        return { types: types, height: height, weight: weight };
    }).catch(() => {
        return { error: 'Could not get pokemon data.' };
    });;
};

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

const StopIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
    },
    handle(handlerInput) {
        const say = 'Thank you for using the Pokemon Info skill!';

        return handlerInput.responseBuilder
            .speak(say)
            .getResponse();
    }
};

const PokemonInfoHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'pokemon_info';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        let say = '';
        const slotValues = request.intent.slots;

        if (slotValues && slotValues.pokemon && slotValues.pokemon.value) {
            let pokemon = slotValues.pokemon.value;
            let data = await getPokemonData(pokemon);
            if (data.error !== undefined) {
                say = 'Hmm, I\'m not sure I know about ' + pokemon + ', are you sure it is a pokemon?';
            } else {
                say = 'Okay, ' + pokemon + ' is a ';
                say += data.types[0].type.name;
                if (data.types.length > 1) {
                    say += ' and ' + data.types[1].type.name;
                }
                say += ' type pokemon with a height of ' + data.height + ' and a weight of ' + data.weight + '.'; 
            }
        } else {
            say = 'Please specify a Pokemon.';
        }

        say += ' What else would you like to know?';
        return handlerInput.responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

const UnhandledIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && (request.intent.name === 'AMAZON.FallbackIntent' ||
        request.intent.name === 'AMAZON.YesIntent' || request.intent.name === 'AMAZON.NoIntent'
        || request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.RepeatIntent');
    },
    handle(handlerInput) {
        const say = 'I could not quite understand what you said. Would you like to know something else?';

        return handlerInput.responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

skillBuilder.addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    StopIntentHandler,
    PokemonInfoHandler,
    UnhandledIntentHandler
);

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

app.post('/', adapter.getRequestHandlers());

app.listen(80, () => {
  console.log('Listening...')
});
