function fmt(level, tag, msg) {
  const ts = new Date().toISOString().slice(11, 23);
  return `${ts} [${level}] [${tag}] ${msg}`;
}

export const logger = {
  info:  (tag, msg) => console.log(fmt('INFO', tag, msg)),
  warn:  (tag, msg) => console.warn(fmt('WARN', tag, msg)),
  error: (tag, msg, err) => console.error(fmt('ERROR', tag, msg), err?.stack || err || ''),
};
