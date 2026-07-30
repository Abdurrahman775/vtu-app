/**
 * Thin client for the upstream VTU reseller API (airtime/data/cable).
 * The concrete provider (e.g. VTpass, Baxi) is decided by the client per
 * Section 7 of the proposal — swap the fetch calls below once chosen.
 */

function config() {
  const baseUrl = process.env.VTU_PROVIDER_BASE_URL;
  const apiKey = process.env.VTU_PROVIDER_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("VTU provider is not configured");
  return { baseUrl, apiKey };
}

export type VtuPurchaseResult = {
  success: boolean;
  providerReference: string;
  message: string;
};

export async function purchaseAirtime(params: {
  network: string;
  phone: string;
  amountNaira: number;
  reference: string;
}): Promise<VtuPurchaseResult> {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}/airtime`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function purchaseData(params: {
  network: string;
  phone: string;
  planCode: string;
  reference: string;
}): Promise<VtuPurchaseResult> {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}/data`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function purchaseCableSubscription(params: {
  provider: string;
  smartCardNumber: string;
  planCode: string;
  reference: string;
}): Promise<VtuPurchaseResult> {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}/cable`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function purchaseExamPin(params: {
  examBody: string;
  quantity: number;
  reference: string;
}): Promise<VtuPurchaseResult> {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}/exam-pin`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export type MeterVerificationResult = {
  customerName: string;
  address: string;
};

export async function verifyMeter(params: {
  disco: string;
  meterNumber: string;
  meterType: "PREPAID" | "POSTPAID";
}): Promise<MeterVerificationResult> {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}/electricity/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function purchaseElectricity(params: {
  disco: string;
  meterNumber: string;
  meterType: "PREPAID" | "POSTPAID";
  reference: string;
}): Promise<VtuPurchaseResult> {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}/electricity`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}
