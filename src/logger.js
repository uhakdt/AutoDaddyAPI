import appInsights from "applicationinsights";
import dotenv from "dotenv";
dotenv.config();

appInsights.setup(process.env["AZURE_LOGGER_INSTRUMENTATION_KEY"]).start();

const client = appInsights.defaultClient;

function log(message) {
  client.trackTrace({ message });
}

function logException(exception) {
  client.trackException({ exception });
}

function trackRequest({ name, resultCode, success }) {
  client.trackRequest({
    name: name,
    resultCode: resultCode,
    success: success,
  });
}

export { log, logException, trackRequest };
