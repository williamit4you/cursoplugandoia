export async function register() {
  if (process.env.NEXT_RUNTIME !== "edge") {
    const { startInternalCronScheduler } = await import("./lib/internalCronScheduler");
    startInternalCronScheduler();

    const { startInternalCronSchedulerEngagement } = await import("./lib/internalCronSchedulerEngagement");
    startInternalCronSchedulerEngagement();

    const { startInternalSocialCronScheduler } = await import("./lib/internalSocialCronScheduler");
    startInternalSocialCronScheduler();

    const { startInternalCronSchedulerVideoEngagement } = await import("./lib/internalCronSchedulerVideoEngagement");
    startInternalCronSchedulerVideoEngagement();
  }
}
