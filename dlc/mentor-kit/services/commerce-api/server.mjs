import { createCommerceApi } from "./app.mjs";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const host = process.env.HOST ?? "0.0.0.0";

const { server } = createCommerceApi({
  internalToken: process.env.COMMERCE_API_TOKEN,
  graderToken: process.env.MENTOR_SERVICE_ADMIN_TOKEN,
  barrierArrivalToken: process.env.DLC_BARRIER_ARRIVAL_TOKEN,
});

server.listen(port, host, () => {
  console.log(JSON.stringify({ service: "commerce-api", host, port, status: "listening" }));
});

const shutdown = (signal) => {
  server.close((error) => {
    if (error) {
      console.error(JSON.stringify({ service: "commerce-api", signal, error: error.message }));
      process.exitCode = 1;
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
