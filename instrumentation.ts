export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { startInternalCronScheduler } = await import("./lib/internalCronScheduler");
    startInternalCronScheduler();

    const { startInternalCronSchedulerEngagement } = await import("./lib/internalCronSchedulerEngagement");
    startInternalCronSchedulerEngagement();
  }
}
