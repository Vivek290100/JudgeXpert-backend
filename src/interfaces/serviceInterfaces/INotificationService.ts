export interface INotificationService {
    notifyContestStart(contestId: string, participants: string[]): Promise<void>;
    checkAndNotifyStartingContests(): Promise<void>;
    notifyNewProblem(slug: string): Promise<void>;

    sendPendingNotifications(userId: string): Promise<void>;
  }