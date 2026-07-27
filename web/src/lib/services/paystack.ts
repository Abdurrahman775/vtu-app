const PAYSTACK_BASE_URL = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

export async function initializePaystackTransaction(params: {
  email: string;
  amountKobo: bigint;
  reference: string;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo.toString(),
      reference: params.reference,
    }),
  });

  if (!res.ok) {
    throw new Error(`Paystack initialize failed: ${res.status}`);
  }

  return res.json() as Promise<{
    status: boolean;
    data: { authorization_url: string; access_code: string; reference: string };
  }>;
}

export async function verifyPaystackTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });

  if (!res.ok) {
    throw new Error(`Paystack verify failed: ${res.status}`);
  }

  return res.json() as Promise<{
    status: boolean;
    data: { status: string; reference: string; amount: number };
  }>;
}
