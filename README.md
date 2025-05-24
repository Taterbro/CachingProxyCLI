# CachingProxyCLI

A caching command line interface that uses redis cloud for caching. Demo Project

"docs" for how the project works: https://roadmap.sh/projects/caching-server

### How to use

- install dependencies and the script with `npm install`
- the redis cloud client requires a valid host and password, so you should create a `.env` file at the root of the project and have these two variables
  PASSWORD=[set a redis cloud password here]
  HOST=[set your redis cloud host]
- `npm run dev` to build typescript file to javascript.
- you should be good to go now. Run the command from any directory in your terminal

`caching-proxy --port=[pick a port] --url=[pick a url to connect to]`

to clear cache, use `caching-proxy --clear`
