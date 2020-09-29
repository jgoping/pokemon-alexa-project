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

// Function used to determine the effectiveness of a move against a foe
const getMultiplier = (attackerType, foeType1, foeType2) => {
    let multiplier = 1;
    const superEffectiveSet = superEffectiveMap[attackerType];
    const notVeryEffectiveSet = notVeryEffectiveMap[attackerType];
    const noEffectSet = noEffectMap[attackerType];
    if (noEffectSet.has(foeType1) || noEffectSet.has(foeType2)) {
        multiplier = 0;
    } else {
        // Type 1
        if (superEffectiveSet.has(foeType1)) {
            multiplier *= 2;
        } else if (notVeryEffectiveSet.has(foeType1)) {
            multiplier /= 2;
        }

        // Type 2
        if (superEffectiveSet.has(foeType2)) {
            multiplier *= 2;
        } else if (notVeryEffectiveSet.has(foeType2)) {
            multiplier /= 2;
        }
    }
    return multiplier;
}

// Stores information about super effective match-ups
const superEffectiveMap = {
    'bug': new Set(['grass', 'dark', 'psychic']),
    'dark': new Set(['ghost', 'psychic']),
    'dragon': new Set(['dragon']),
    'electric':	new Set(['flying', 'water']),
    'fairy': new Set(['fighting', 'dark', 'dragon']),
    'fighting': new Set(['dark', 'ice', 'normal', 'rock', 'steel']),
    'fire': new Set(['bug', 'grass', 'ice', 'steel']),
    'flying': new Set(['bug', 'fighting', 'grass']),
    'ghost': new Set(['ghost', 'psychic']),
    'grass': new Set(['ground', 'rock', 'water']),
    'ground': new Set(['electric', 'fire', 'poison', 'rock', 'steel']),
    'ice': new Set(['dragon', 'flying', 'grass', 'ground']),
    'normal': new Set(),
    'poison': new Set(['fairy', 'grass']),
    'psychic': new Set(['fighting', 'poison']),
    'rock': new Set(['bug', 'fire', 'flying', 'ice']),
    'steel': new Set(['fairy', 'ice', 'rock']),
    'water': new Set(['fire', 'ground', 'rock']),
};

// Stores information about not very effective match-ups
const notVeryEffectiveMap = {
    'bug': new Set(['fighting', 'flying', 'poison', 'ghost', 'steel', 'fire', 'fairy']),
    'dark': new Set(['poison', 'steel', 'fire']),
    'dragon': new Set(['steel']),
    'electric':	new Set(['grass', 'electric', 'dragon']),
    'fairy': new Set(['poison', 'steel', 'fire']),
    'fighting': new Set(['flying', 'poison', 'bug', 'psychic']),
    'fire': new Set(['rock', 'fire', 'water', 'dragon']),
    'flying': new Set(['electric', 'rock', 'steel']),
    'ghost': new Set(['dark']),
    'grass': new Set(['flying', 'poison', 'bug', 'steel', 'fire', 'grass', 'dragon']),
    'ground': new Set(['bug', 'grass']),
    'ice': new Set(['steel', 'fire', 'water', 'ice']),
    'normal': new Set(['rock', 'steel']),
    'poison': new Set(['poison', 'ground', 'rock', 'ghost']),
    'psychic': new Set(['steel', 'psychic']),
    'rock': new Set(['fighting', 'ground', 'steel']),
    'steel': new Set(['steel', 'fire', 'water', 'electric']),
    'water': new Set(['water', 'grass', 'dragon']),
};

// Stores information about no effect match-ups
const noEffectMap = {
    'bug': new Set(),
    'dark': new Set(),
    'dragon': new Set(),
    'electric':	new Set(['ground']),
    'fairy': new Set(),
    'fighting': new Set(['ghost']),
    'fire': new Set(),
    'flying': new Set(),
    'ghost': new Set(['normal']),
    'grass': new Set(),
    'ground': new Set(['flying']),
    'ice': new Set(),
    'normal': new Set(['ghost']),
    'poison': new Set(['steel']),
    'psychic': new Set(['dark']),
    'rock': new Set(),
    'steel': new Set(),
    'water': new Set(),
}

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

const PokemonTraitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'pokemon_trait';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        let say = '';
        const slotValues = request.intent.slots;

        if (slotValues && slotValues.pokemon && slotValues.pokemon.value && slotValues.trait) {
            let pokemon = slotValues.pokemon.value;
            let trait = slotValues.trait.value;
            let data = await getPokemonData(pokemon);
            if (data.error !== undefined || (trait !== 'type' && trait !== 'height' && trait !== 'weight')) {
                say = 'Hmm, I don\'t know if I know this ' + trait + ' about ' + pokemon + '.';
            } else if (trait === 'type') {
                say = 'Okay, ' + pokemon + ' is a ';
                say += data.types[0].type.name;
                if (data.types.length > 1) {
                    say += ' and ' + data.types[1].type.name;
                }
                say += ' type pokemon.'; 
            } else if (trait === 'height') {
                say = 'Okay, ' + pokemon + ' is ' + data.height + ' high.';
            } else if (trait === 'weight') {
                say = 'Okay, ' + pokemon + ' has a weight of ' + data.weight + '.';
            }
        } else {
            say = 'I\'m sorry, I don\'t know this pokemon.';
        }

        say += ' What else would you like to know?';
        return handlerInput.responseBuilder
            .speak(say)
            .reprompt(say)
            .getResponse();
    }
};

const PokemonAttackHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'pokemon_attack';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        let say = '';
        const slotValues = request.intent.slots;

        if (slotValues && slotValues.attacker && slotValues.foe) {
            const attacker = slotValues.attacker.value;
            const foe = slotValues.foe.value;
            const attackerData = await getPokemonData(attacker);
            const foeData = await getPokemonData(foe);

            if (attackerData.error !== undefined || foeData.error !== undefined) {
                say = 'Hmm, I don\'t know if I know these pokemon.';
            } else {
                const attackerType1 = attackerData.types[0].type.name;
                const attackerType2 = attackerData.types.length > 1 ? attackerData.types[1].type.name : '';
                const foeType1 = foeData.types[0].type.name;
                const foeType2 = foeData.types.length > 1 ? foeData.types[1].type.name : '';
                
                // Attacker uses a move of type 1
                say += 'Okay, ' + attacker + ' uses a ' + attackerType1 + ' type move: ';
                let multiplier = getMultiplier(attackerType1, foeType1, foeType2);
                say += 'it is ' + multiplier + 'x effective.';
                
                if (attackerType2 !== '') {
                    say += ' Now ' + attacker + ' uses a ' + attackerType2 + ' type move: ';
                    multiplier = getMultiplier(attackerType2, foeType1, foeType2);
                    say += 'it is ' + multiplier + 'x effective.';
                }
            }
        } else {
            say = 'I\'m sorry, I could not understand what you meant.';
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
    PokemonTraitHandler,
    PokemonAttackHandler,
    UnhandledIntentHandler
);

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

app.post('/', adapter.getRequestHandlers());

app.listen(80, () => {
  console.log('Listening...')
});
