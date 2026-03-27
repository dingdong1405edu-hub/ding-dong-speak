import { PayOS } from "@payos/node";

export function getPayOS() {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error("PayOS environment variables are missing");
  }

  return new PayOS({
    clientId,
    apiKey,
    checksumKey,
  });
}
