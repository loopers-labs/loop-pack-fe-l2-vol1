import { createAnalyticsSink } from "./app.mjs";

const port = Number.parseInt(process.env.PORT ?? "4001", 10);
const host = process.env.HOST ?? "0.0.0.0";

const { server } = createAnalyticsSink({
  writeToken: process.env.ANALYTICS_WRITE_TOKEN,
  graderToken: process.env.MENTOR_SERVICE_ADMIN_TOKEN,
  allowedOrigins: (process.env.ANALYTICS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});

server.listen(port, host, () => {
  console.log(JSON.stringify({ service: "analytics-sink", host, port, status: "listening" }));
});

const shutdown = (signal) => {
  server.close((error) => {
    if (error) {
      console.error(JSON.stringify({ service: "analytics-sink", signal, error: error.message }));
      process.exitCode = 1;
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
