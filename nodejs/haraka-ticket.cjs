// Docs: README.md. Load before recipient acceptance plugins in config/plugins.
exports.register = function () { this.register_hook('rcpt', 'check_ticket'); };
exports.check_ticket = function (next, connection, params) {
  const recipient = params[0].address().toLowerCase();
  if (recipient !== 'ticket+42@example.com') return next(DENY, 'Unknown ticket');
  next(); // Continue to the configured recipient and queue plugins; do not short-circuit.
};
