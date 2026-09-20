// Public liveness + published signer address
export const handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    ok: true,
    signedBy: process.env.APP_SIGNER_ADDRESS,
    contract: process.env.SBT_ADDRESS,
    chainId: process.env.CHAIN_ID,
    schema: "OfferLetter/v1",
  }),
});
