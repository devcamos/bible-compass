/** Keep provider call logs, authentication headers and share URLs out of reports. */
export function redactPreviewError(error, shareUrl) {
  return String(error?.message ?? error).split(/\r?\n/,1)[0]
    .split(shareUrl).join("[private access]")
    .replace(/([?&]_vercel_share=)[^&\s)]+/gi,"$1[redacted]")
    .replace(/(?:cookie|authorization)\s*[:=].*/gi,"[redacted header]");
}
