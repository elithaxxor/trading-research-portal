import * as Sentry from "@sentry/nextjs";

import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryTracesSampleRate,
  isSentryEnabled,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
} from "./lib/monitoring/sentry";

if (isSentryEnabled()) {
  Sentry.init({
    beforeBreadcrumb: scrubSentryBreadcrumb,
    beforeSend: scrubSentryEvent,
    dsn: getSentryDsn(),
    enableLogs: false,
    environment: getSentryEnvironment(),
    normalizeDepth: 4,
    sendDefaultPii: false,
    tracesSampleRate: getSentryTracesSampleRate(),
  });
}
