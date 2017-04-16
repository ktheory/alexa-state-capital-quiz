"use strict";
const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).
const Alexa = require("alexa-sdk");
const S = require('sanctuary');

var GAME_STATES = {
    TRIVIA: "_TRIVIAMODE", // Asking trivia questions.
    START: "_STARTMODE" // Entry point, start the game.
};
//var questions = require("./questions");
const questions = require("./states");

/**
 * When editing your questions pay attention to your punctuation. Make sure you use question marks or periods.
 * Make sure the first answer is the correct one. Set at least ANSWER_COUNT answers, any extras will be shuffled in.
 */
var languageString = {
    "en": {
        "translation": {
            "GAME_NAME" : "State Capitals Quiz", // Be sure to change this for your skill.
            "REPEAT_QUESTION_MESSAGE": "To repeat the last question, say, repeat. ",
            "ASK_MESSAGE_START": "Would you like to start playing?",
            "STOP_MESSAGE": "Okay. Goodbye.",
            "CANCEL_MESSAGE": "Ok, let\'s play again soon.",
            "NO_MESSAGE": "Ok, we\'ll play another time. Goodbye!",
            "TRIVIA_UNHANDLED": "Try saying the name of a state or capital",
            "START_UNHANDLED": "Say start to start a new game.",
            "NEW_GAME_MESSAGE": "Hi Adrian. Let\'s practice some state capitals. ",
            "ANSWER_CORRECT_MESSAGE": "Correct. ",
            "ANSWER_WRONG_MESSAGE": "That\'s incorrect. ",
            "CORRECT_ANSWER_MESSAGE": "The correct answer is %s. ",
            "ANSWER_IS_MESSAGE": "That answer is ",
            "GAME_OVER_MESSAGE": "You got %s out of %s questions correct. Thank you for playing!"
        }
    },
    "en-US": {
        "translation": {
            "GAME_NAME" : "United States Capitals Quiz" // Be sure to change this for your skill.
        }
    }
};

exports.handler = (event, context, callback) => {
    console.log("Event: " + JSON.stringify(event));
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, triviaStateHandlers);
    alexa.execute();
};

var newSessionHandlers = {
    "LaunchRequest": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "Unhandled": function () {
        var speechOutput = this.t("START_UNHANDLED");
        this.emit(":ask", speechOutput, speechOutput);
    }
};

const startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    "StartGame": function (newGame) {
        var speechOutput = newGame ? this.t("NEW_GAME_MESSAGE") : "";
        //var gameQuestions = questions;
        const currentQuestionIndex = nextQuestionIndex(questions)
        var spokenQuestion = questions[currentQuestionIndex].question;
        var repromptText = spokenQuestion;

        speechOutput += repromptText;

        Object.assign(this.attributes, {
            "speechOutput": repromptText,
            "repromptText": repromptText,
            "currentQuestionIndex": currentQuestionIndex,
            "correctAnswerText": questions[currentQuestionIndex].answer
        });

        // Set the current state to trivia mode. The skill will now use handlers defined in triviaStateHandlers
        this.handler.state = GAME_STATES.TRIVIA;
        this.emit(":askWithCard", speechOutput, repromptText, this.t("GAME_NAME"), repromptText);
    }
});

var triviaStateHandlers = Alexa.CreateStateHandler(GAME_STATES.TRIVIA, {
    "AnswerIntent": function () {
        handleUserGuess(this, false);
    },
    "DontKnowIntent": function () {
        handleUserGuess(this, true);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptText"]);
    },
    "AMAZON.StopIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", this.t("CANCEL_MESSAGE"));
    },
    "Unhandled": function () {
        var speechOutput = this.t("TRIVIA_UNHANDLED", ANSWER_COUNT.toString());
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in trivia state: " + this.event.request.reason);
    }
});

const handleUserGuess = (ctx, userGaveUp) => {

  console.log("GUESS: " + userAnswer(ctx));
  let speechOutput = ""
  if (S.equals(correctAnswer(ctx), userAnswer(ctx))) {
    speechOutput += "Correct. "

  } else {
    speechOutput += "Sorry. The correct answer is " + correctAnswer(ctx) + ". "
  }


  //const nextQuestionIndex = currentQuestionIndex + 1
  const idx = nextQuestionIndex(questions)
  const nextQuestion = questions[idx].question

  speechOutput += nextQuestion


  Object.assign(ctx.attributes, {
    "speechOutput": speechOutput,
    "repromptText": nextQuestion,
    "currentQuestionIndex": idx
  });

  ctx.emit(":ask", speechOutput, nextQuestion);
}

const userAnswer = (ctx) =>
  S.gets(
    S.is(String),
    ['event', 'request', 'intent', 'slots', 'Answer', 'value']
  )(ctx)

const correctAnswer = (ctx) =>
  S.chain(
    S.get( S.is(String), "answer"),
    S.chain(S.at(S.__, questions), currentQuestionIndex(ctx))
  )

const currentQuestionIndex = (ctx) =>
  S.gets(
    S.is(Number),
    ['attributes', 'currentQuestionIndex']
  )(ctx)

const nextQuestionIndex = (questions) =>
  Math.floor(Math.random() * questions.length)
