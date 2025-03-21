import { createBot } from "mineflayer";
import { customAlphabet } from "nanoid";
import { use, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import winston, { format, transports } from "winston";
const { combine, timestamp, printf } = format;

const logger = winston.createLogger({
    level: "debug",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss Z" }), printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}] ${message}`;
    })),
    transports: [
        new transports.Console({
            level: "debug"
        })
    ]
});

const ignAlphabet = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_");

// Map<string, string>
const hosts = new Map();

const versions = [
    "1.21", "1.21.1", "1.21.2", "1.21.3", "1.21.4",
    "1.20", "1.20.1", "1.20.2", "1.20.3", "1.20.4", "1.20.5", "1.20.6",
    "1.19", "1.19.1", "1.19.2", "1.19.3", "1.19.4",
    "1.18", "1.18.1", "1.18.2",
    "1.17", "1.17.1",
    "1.16", "1.16.1", "1.16.2", "1.16.3" ,"1.16.4", "1.16.5",
    "1.15", "1.15.1", "1.15.2",
    "1.14", "1.14.1", "1.14.2", "1.14.3", "1.14.4",
    "1.13", "1.13.1", "1.13.2",
    "1.12", "1.12.1", "1.12.2",
    "1.11", "1.11.1", "1.11.2",
    "1.10", "1.10.1", "1.10.2",
    "1.9", "1.9.1", "1.9.2", "1.9.3", "1.9.4",
    "1.8", "1.8.1", "1.8.2", "1.8.3", "1.8.4", "1.8.5", "1.8.6", "1.8.7", "1.8.8", "1.8.9"
];

// [string, string, string][]
const cases = [];

function setMapref(k, v) {
    hosts.set(k, v);
}

setMapref("127.0.0.1", "test1");
setMapref("localhost", "test2");
setMapref("minecraft.test1.local", "test3");
setMapref("fruit.test2.local", "test4");
setMapref("mocksrv.a.test3.local", "test5");
setMapref("abc.test4.local", "test6");

// [string, string][]
const entries = Array.from(hosts.entries());

for (const ver of versions) {
    for (const eni of entries) {
        cases.push([ver, eni[0], eni[1]]);
    }
}

const TIMEOUT = 5 * 1000;
const DELAY = 100;
const RETRIES = 5;

let bot;
const botOpt = {
    username: "testing_nginx",
    auth: "offline",
    checkTimeoutInterval: TIMEOUT,
    physicsEnabled: false,
    closeTimeout: TIMEOUT,
    logErrors: true,
    hideErrors: false
};

use(chaiAsPromised);

const tf = async (_ver, _host, _exp) => {
    const key = _host;
    const value = _exp;
    const vi = _ver;
    const ign =  ignAlphabet(16);
    await new Promise(resolve => setTimeout(resolve, DELAY));
    const res = new Promise((resolve, reject) => {
        botOpt.username = ign;
        logger.info(`Doing test on ${key} - ${value} (${vi}) (${ign})`);
        botOpt.host = "127.0.0.1";
        botOpt.port = process.env.MC_PORT !== undefined ? process.env.MC_PORT : "25565";
        botOpt.fakeHost = key;
        botOpt.version = vi;
        try {
            bot = createBot(botOpt);
        } catch (err) {
            reject(err);
            return;
        }
        const sec = setTimeout(() => {
            bot.end("Testing timed out!!!");
            reject("Testing timed out!!!");
        }, TIMEOUT - 1000);
        bot.once("error", (err) => {
            bot.end("BOT ERROR!!!");
            reject(err);
        });
        bot.once("end", (reason) => {
            clearTimeout(sec);
            logger.info(`Bot ended: ${key} - ${value} (${vi}) (${ign}) (${reason})`);
            if (reason !== "disconnect.quitting") {
                reject(reason);
            }
        });
        bot.once("kicked", (err, loggedIn) => {
            bot.end();
            reject(new Error(`KICKED!!! Reason: ${err}. Is logged in: ${loggedIn}`));
        });
        // https://stackoverflow.com/questions/67764944/node-js-saying-that-a-function-is-not-a-function
        bot.on("messagestr", (message) => {
            // https://prismarinejs.github.io/mineflayer/#/api?id=botendreason
            logger.info(`Received "${message}": ${key} - ${value} (${vi}) (${ign})`);
            if (message.includes("Can't deliver chat message, check server logs")) {
                logger.warn(`Error message from remote! "${message}": ${key} - ${value} (${vi}) (${ign})`);
            }
            if (message.includes(value)) {
                logger.info(`Resolve: ${key} - ${value} (${vi}) (${ign})`);
                resolve(message);
            } else {
                reject(message);
            }
            bot.quit();
        });
    });
    return expect(res).to.eventually.be.fulfilled;
};

if (cases.length > 0) {
    describe("Testing Nginx", function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        cases.forEach(c => {
            it(`using version ${c[0]}, hostname ${c[1]}, expect ${c[2]}`, function () {
                return tf(c[0], c[1], c[2]);
            }).timeout(TIMEOUT).retries(RETRIES);
        });
    });
} else {
    logger.error("No testing case set!!!");
    process.exit(1);
}
