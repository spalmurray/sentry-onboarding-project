import express from 'express';
import * as Sentry from '@sentry/node';

const app = express();
const port = 3000;

Sentry.init({
  dsn: process.env.USE_PROD ? "https://f576a78283384808908ac5a5fd975637@o19635.ingest.sentry.io/4504335489761280" : "https://499a8b960e5c4c6782164a1e73202192@spencer.sentry.ngrok.dev/10",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    // Automatically instrument Node.js libraries and frameworks
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.get('/', (req, res) => {
  console.log('GET @ /');
  const transaction = Sentry.startTransaction({ name: "meowdy" });
  Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(transaction));
  res.send("meowdy");
  transaction.finish();
});

app.get('/bad', (req, res) => {
  console.log('GET @ /bad');
  throw new Error('oof this is a bad endpoint');
});

app.get('/also/bad', (req, res) => {
  console.log('GET @ /also/bad');
  throw new Error('this one is also bad!');
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.listen(port, () => {
  console.log(process.env.USE_PROD ? 'Using prod DSN' : 'Using local DSN');
  console.log(`Sentry onboarding app listening on port ${port}`);
});
