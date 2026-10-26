import assert from "node:assert/strict";
import test from "node:test";
import { redactPreviewError } from "./preview-error.mjs";

test("Preview errors keep the useful failure but omit provider call logs and cookies",()=>{
  const error=new Error("apiRequestContext.get: connection refused\nCall log:\n  - cookie: _vercel_jwt=synthetic-cookie\n  - authorization: Bearer synthetic-token\n");
  assert.equal(redactPreviewError(error,"https://preview.example/?_vercel_share=synthetic-share"),"apiRequestContext.get: connection refused");
});
test("Preview error first lines redact complete share URLs and alternate share parameters",()=>{
  const share="https://preview.example/gifts?_vercel_share=synthetic-share";
  assert.equal(redactPreviewError(new Error("page.goto: "+share),share),"page.goto: [private access]");
  assert.equal(redactPreviewError(new Error("page.goto: https://preview.example/other?_vercel_share=another-synthetic-share"),share),"page.goto: https://preview.example/other?_vercel_share=[redacted]");
});
