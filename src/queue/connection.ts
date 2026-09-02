import { env } from "../../utility/envImport";

export const connection = {
  host:env.REDIS_HOST ,
  port: Number(env.REDIS_PORT),
  ...(env.REDIS_PASSWORD
    ? { password: env.REDIS_PASSWORD }
    : {}),
  // Upstash requires TLS
  tls: {},

  // BullMQ recommendation
  maxRetriesPerRequest: null,
};