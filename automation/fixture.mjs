// Docs: README.md#local-run
export function fixture(deliveryId = 'ticket-42', extra = '') {
  return {
    source: 'fixture', deliveryId,
    envelopeFrom: 'customer@example.com', recipient: 'support@example.com',
    raw: `From: Customer <customer@example.com>\r\nTo: support@example.com\r\nMessage-ID: <ticket-42@example.com>\r\nReferences: <ticket-root@example.com>\r\nSubject: Invoice question\r\n${extra}Content-Type: text/plain; charset=utf-8\r\n\r\nPlease check invoice 42.\r\n`,
  };
}
