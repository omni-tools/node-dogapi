const _ = require('lodash/fp');
const api = require('./api');
const ApiClient = require('./api-client');

const extend = _.extend.convert({immutable: false});

const buildApiHandlers = client => spec => {
  // TODO? validate spec with schema? at least as dev part!
  const needId = _.get('params.0.type', spec) === 'id';
  if (needId) {
    return (id, ...args) => client.request(spec.method, spec.path.replace('*', id), ...args);
  }
  return client.request.bind(client, spec.method, spec.path);
};

const loadApi = (apis, client, destination) => {
  for (const [sectionName, sectionSpec] of Object.entries(apis)) {
    destination[sectionName] = _.mapValues(buildApiHandlers(client), sectionSpec);
  }
};

function DatadogClient(options) {
  const client = (_.has('client'), options) ? options.client : new ApiClient(options || {});
  loadApi(api, client, this);
}

const initialClient = new ApiClient({});
/* section: dogapi
 *comment: configure the dogapi client with your app/api keys
 *params:
 *  options:
 *   |
 *    An object which allows you to override the default set parameters for interacting
 *    with the datadog api. The available options are.
 *    * api_key: your api key
 *    * app_key: your app key
 *    * api_version: the version of the api [default: `v1`]
 *    * api_host: the host to call [default: `api.datadoghq.com`]
 *    * proxy_agent: Optional, A Https Proxy agent.
 *example:
 *  |
 *    ```javascript
 *    var dogapi = require("dogapi");
 *
 *    // Optional for Proxy -------8<----------
 *    // Code from http://blog.vanamco.com/proxy-requests-in-node-js/
 *    var HttpsProxyAgent = require("./httpsproxyagent");
 *
 *    var agent = new HttpsProxyAgent({
 *        proxyHost: "MY_PROXY_HOST",
 *        proxyPort: 3128
 *    });
 *    // Optional for Proxy -------->8----------
 *
 *    var options = {
 *      api_key: "<API_KEY_HERE>",
 *      app_key: "<APP_KEY_HERE>",
 *      proxy_agent: agent  // Optional for Proxy
 *    };
 *    dogapi.initialize(options);
 *    dogapi.event.create(...);
 *    ```
 */

DatadogClient.initialize = options => {
  _.keys(options || {}).forEach(key => {
    initialClient[key] = options[key];
  });
};

// Load all api into module namespace
loadApi(api, initialClient, DatadogClient);

/* section: dogapi
 *comment: get the current POSIX timestamp
 *example: |
 *  ```javascript
 *  var dogapi = require("dogapi");
 *  dogapi.now();
 *  // this is the same as
 *  Math.round(Date.now() / 1000);
 *  ```
 */
function now() {
  return Math.round(Date.now() / 1000);
}
module.exports = extend(DatadogClient, {now, OK: 0, WARNING: 1, CRITICAL: 2, UNKNOWN: 3});
