export type Job =
  | { type: "SEND_SESSION_REMINDER"; sessionId: string; scheduledFor: string }
  | { type: "SUMMARIZE_SESSION"; sessionId: string }
  | { type: "DELETE_USER_DATA"; userId: string };

export interface JobQueue {
  enqueue(job: Job): Promise<void>;
}

export class UnconfiguredJobQueue implements JobQueue {
  async enqueue(job: Job): Promise<void> {
    throw new Error(`No job queue configured for ${job.type}`);
  }
}
