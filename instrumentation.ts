export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startInternalCronScheduler } = await import("./lib/internalCronScheduler");
    startInternalCronScheduler();
  }
}
