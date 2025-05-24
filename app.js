#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const http_1 = __importDefault(require("http"));
const axios_1 = __importDefault(require("axios"));
//import NodeCache from "node-cache";
const redis_1 = require("redis");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(__dirname, ".env");
dotenv.config({ path: envPath });
console.log("Loaded environment variables:", dotenv.config().parsed);
const password = process.env.PASSWORD;
const host = process.env.HOST;
const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .option("clear", { type: "boolean" })
    .option("port", { type: "number" })
    .option("url", { type: "string" })
    .parseSync();
//const cache = new NodeCache({ stdTTL: 2000 });  //was using in-memory caching initially but switched
const client = (0, redis_1.createClient)({
    username: "default",
    password: password,
    socket: {
        host: host,
        port: 13251,
    },
});
const main = (port, url, clear) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(host, password);
    client.on("error", (err) => {
        console.log("Redis Client Error", err);
        process.exit(0);
    });
    yield client.connect();
    if (clear) {
        return client
            .flushAll()
            .then(() => console.log("Cache has been cleared"))
            .catch((err) => console.log("something went wrong: \n", err));
    }
    const app = http_1.default.createServer((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const path = req.url;
        const cacheKey = `${url}${path}`;
        const cachedData = yield client.get(cacheKey);
        if (cachedData) {
            res.setHeader("X-Cache", "HIT");
            return res.end(JSON.stringify(cachedData));
        }
        axios_1.default
            .get(`${url}${path}`)
            .then((response) => {
            client.set(cacheKey, JSON.stringify(response.data));
            res.setHeader("X-Cache", "MISS");
            res.end(JSON.stringify(response.data));
        })
            .catch((err) => {
            console.log("error: ", err);
            res.end(JSON.stringify(err));
        });
    }));
    app.listen(port || 3000, "localhost", () => console.log(`listening on port ${port} to ${url}`));
});
main(argv.port, argv.url, argv.clear);
