// Docs: README.md. Postal v1 reports application errors inside its JSON response.
export async function postalReceipt(baseUrl, key, fetchImpl = fetch) {
  const response = await fetchImpl(`${baseUrl}/api/v1/send/message`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Server-API-Key': key },
    body: JSON.stringify({ from: 'app@example.com', to: ['customer@example.com'],
      subject: 'Ticket 42 receipt', plain_body: 'Log received.', tag: 'ticket-42' }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || result.status !== 'success') throw new Error('Postal rejected request');
  return result.data;
}
