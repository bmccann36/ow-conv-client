
var redis = require('redis');
const bluebird = require('bluebird')
const url = require("url");
const ConversationV1 = require('watson-developer-cloud/conversation/v1')
const chalk = require('chalk')

bluebird.promisifyAll(redis.RedisClient.prototype);

let redisClient
let context

if (process.env.USER == 'Brian') {
  main(require('./params.json'))
}

async function main(args) {
  await initClients(args)
  await getSessionContext('1')
  const res = await conversationMessage('make me some food', args.WORKSPACE_ID)
  // action handler goes here
  saveSessionContext('1')
  magenta('res')
  return res

}



exports.main = main;

function saveSessionContext(sessionId) {
  magenta('Begin saveSessionContext');
  // Save the context in Redis. Can do this after resolve(response).
  if (context) {
    const newContextString = JSON.stringify(context);
    // Saved context will expire in 600 secs.
    redisClient.set(sessionId, newContextString, 'EX', 600);
    console.log('Saved context in Redis');
  }
}

function conversationMessage(input, workspaceId) {
  return new Promise(function (resolve, reject) {
    console.log('Input text: ' + input);
    conversation.message(
      {
        input: { text: input },
        workspace_id: workspaceId,
        context: context
      },
      function (err, watsonResponse) {
        if (err) {
          console.error(err);
          reject('Error talking to Watson.');
        } else {
          context = watsonResponse.context; // Update global context
          resolve(watsonResponse);
        }
      }
    );
  });
}

function getSessionContext(sessionId) {
  console.log('sessionId: ' + sessionId);
  return new Promise(function (resolve, reject) {
    redisClient.get(sessionId, function (err, value) {
      if (err) {
        console.error(err);
        reject('Error getting context from Redis.');
      }
      // set global context
      context = value ? JSON.parse(value) : {};
      // magenta('context:');
      // console.log(context);
      resolve();
    });
  });
}

function initClients(args) {
  return new Promise((resolve, reject) => {
    redisClient = redis.createClient(args.REDIS_URI,
      {
        tls: { servername: url.parse(args.REDIS_URI).hostname }
      })
    redisClient.on("error", (err) => { console.log("redis error", console.log(err)) });
    redisClient.on("connect", () => {
      console.log('connected to db')
      resolve()
    })
    redisClient.on("end", () => { console.log('ended DB connection') })
    conversation = new ConversationV1({
      username: args.CONVERSATION_USERNAME,
      password: args.CONVERSATION_PASSWORD,
      version_date: ConversationV1.VERSION_DATE_2017_04_21
    });
    console.log('Connected to Watson Conversation');
  })
}

// try {
//   await redisClient.setAsync('foo', 'bar')
//   const fetch = await redisClient.getAsync('foo')
//   console.log(fetch)
//   redisClient.quit()
// } catch (err) {
//   redisClient.quit()
//   console.log('caught error', err)
// }


function magenta(str) {
  console.log(chalk.magenta(str))
}
