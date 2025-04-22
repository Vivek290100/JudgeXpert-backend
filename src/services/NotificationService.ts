import { Server } from "socket.io";
import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";
import { INotificationService } from "../interfaces/serviceInterfaces/INotificationService";
import { FilterQuery } from "mongoose";

class NotificationService implements INotificationService {
  private pendingNotifications: Map<string, any[]> = new Map();
  private notifiedContests: Set<string> = new Set();

  constructor(
    private contestRepository: IContestRepository,
    private io: Server
  ) {
    setInterval(() => {
      this.pendingNotifications.forEach((notifications, userId) => {
        this.pendingNotifications.set(
          userId,
          notifications.filter((n) => new Date(n.timestamp) > new Date(Date.now() - 3600000))
        );
        if (this.pendingNotifications.get(userId)!.length === 0) {
          this.pendingNotifications.delete(userId);
        }
      });
    }, 300000);
  }

  async notifyContestStart(contestId: string, participants: string[]): Promise<void> {
    const contest = await this.contestRepository.findById(contestId);
    if (!contest) {
      return;
    }

    if (this.notifiedContests.has(contestId)) {
      return;
    }


    const notification = {
      type: "contestStarted",
      contestId: contest._id,
      title: contest.title,
      message: `Contest ${contest.title} has started.`,
      timestamp: new Date().toISOString(),
    };

    participants.forEach((userId) => {
      const socketId = this.io.sockets.adapter.rooms.get(userId)?.values().next().value;
      if (socketId) {
        this.io.to(socketId).emit("contestStarted", notification);
      } else {
        const userNotifications = this.pendingNotifications.get(userId) || [];
        if (!userNotifications.some((n) => n.contestId === contestId)) {
          userNotifications.push(notification);
          this.pendingNotifications.set(userId, userNotifications);
        }
      }
    });

    this.notifiedContests.add(contestId);
  }

  async checkAndNotifyStartingContests(): Promise<void> {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    const query: FilterQuery<any> = {
      startTime: { $gte: thirtySecondsAgo, $lte: now },
      isBlocked: false,
    };

    const { contests } = await this.contestRepository.findPaginated(1, 1000, query);

    for (const contest of contests) {
      const participantIds = contest.participants.map((p: any) => p._id.toString());
      await this.notifyContestStart(contest._id, participantIds);
    }
  }

  async sendPendingNotifications(userId: string): Promise<void> {
    const notifications = this.pendingNotifications.get(userId) || [];
    if (notifications.length === 0) {
      return;
    }

    const socketId = this.io.sockets.adapter.rooms.get(userId)?.values().next().value;
    if (socketId) {
      notifications.forEach((notification) => {
        this.io.to(socketId).emit("contestStarted", notification);
      });
      this.pendingNotifications.delete(userId);
    }
  }
}

export default NotificationService;