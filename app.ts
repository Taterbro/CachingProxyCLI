#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import http from "http";
import axios from "axios";
//import NodeCache from "node-cache";
import { createClient } from "redis";
import * as dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });

const password = process.env.PASSWORD;
const host = process.env.HOST;
const argv = yargs(hideBin(process.argv))
  .option("clear", { type: "boolean" })
  .option("port", { type: "number" })
  .option("url", { type: "string" })
  .parseSync();
//const cache = new NodeCache({ stdTTL: 2000 });  //was using in-memory caching initially but switched
const client = createClient({
  username: "default",
  password: password,
  socket: {
    host: host,
    port: 13251,
  },
});

const main = async (
  port: number | undefined,
  url: string | undefined,
  clear: boolean | undefined
) => {
  console.log(host, password);
  client.on("error", (err) => {
    console.log("Redis Client Error", err);
    process.exit(0);
  });
  await client.connect();
  if (clear) {
    return client
      .flushAll()
      .then(() => {
        console.log("Cache has been cleared");
        process.exit(0);
      })
      .catch((err) => console.log("something went wrong: \n", err));
  }
  const app = http.createServer(async (req, res) => {
    const path = req.url;
    const cacheKey = `${url}${path}`;
    const cachedData = await client.get(cacheKey);

    if (cachedData) {
      res.setHeader("X-Cache", "HIT");
      return res.end(JSON.stringify(cachedData));
    }

    axios
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
  });
  app.listen(port || 3000, "localhost", () =>
    console.log(`listening on port ${port} to ${url}`)
  );
};

main(argv.port, argv.url, argv.clear);
