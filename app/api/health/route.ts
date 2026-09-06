export function GET() {
  return Response.json({
    status: "ok",
    capabilities: {
      database: false,
      jobQueue: false,
      speech: false,
      poseAnalysis: "adapter-required",
    },
  });
}
