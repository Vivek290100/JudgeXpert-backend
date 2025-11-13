import { Server } from "socket.io";
import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";
import { INotificationService } from "../interfaces/serviceInterfaces/INotificationService";
import { FilterQuery } from "mongoose";
import User from "../models/UserModel";

class NotificationService implements INotificationService {
  private pendingNotifications: Map<string, any[]> = new Map();
  private notifiedContests: Set<string> = new Set();
  private notifiedProblems: Set<string> = new Set();

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
    try {
      const contest = await this.contestRepository.findById(contestId);
      if (!contest) {
        console.log(`Contest not found: ${contestId}`);
        return;
      }

      if (this.notifiedContests.has(contestId)) {
        console.log(`Contest already notified: ${contestId}`);
        return;
      }

      const notification = {
        type: "contestStarted",
        contestId: contest._id.toString(),
        title: contest.title,
        message: `Contest ${contest.title} has started.`,
        timestamp: new Date().toISOString(),
      };
      console.log("Prepared contestStarted notification:", JSON.stringify(notification, null, 2));

      for (const userId of participants) {
        const socketId = this.io.sockets.adapter.rooms.get(userId)?.values().next().value;
        if (socketId) {
          console.log(`Sending contestStarted to user ${userId} via socket ${socketId}`);
          this.io.to(userId).emit("contestStarted", notification);
        } else {
          console.log(`User ${userId} offline, queuing contestStarted notification`);
          const userNotifications = this.pendingNotifications.get(userId) || [];
          if (!userNotifications.some((n) => n.contestId === contestId)) {
            userNotifications.push(notification);
            this.pendingNotifications.set(userId, userNotifications);
          }
        }
      }

      this.notifiedContests.add(contestId);
    } catch (error) {
      console.error(`Error notifying contest start for ${contestId}:`, error);
    }
  }

  async checkAndNotifyStartingContests(): Promise<void> {
    try {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

      const query: FilterQuery<any> = {
        startTime: { $gte: thirtySecondsAgo, $lte: now },
        isBlocked: false,
      };

      const { contests } = await this.contestRepository.findPaginated(1, 1000, query);

      for (const contest of contests) {
        if (this.notifiedContests.has(contest._id.toString())) {
          console.log(`Skipping already notified contest: ${contest._id}`);
          continue;
        }
        const participantIds = contest.participants.map((p: any) => p._id.toString());
        await this.notifyContestStart(contest._id.toString(), participantIds);
      }
    } catch (error) {
      console.error("Error checking and notifying starting contests:", error);
    }
  }

  async notifyNewProblem(slug: string): Promise<void> {
    if (this.notifiedProblems.has(slug)) {
      return;
    }

    const admins = await User.find({ role: "admin" }).select("_id");
    if (!admins.length) {
      console.log("No admins found to notify for new problem:", slug);
      return;
    }

    const notification = {
      type: "newProblem",
      slug,
      message: `New problem folder detected: ${slug}`,
      timestamp: new Date().toISOString(),
    };

    admins.forEach((admin) => {
      const userId = admin._id.toString();
      const socketId = this.io.sockets.adapter.rooms.get(userId)?.values().next().value;
      if (socketId) {
        console.log(`Sending newProblem to admin ${userId} via socket ${socketId}`);
        this.io.to(socketId).emit("newProblem", notification);
      } else {
        console.log(`Admin ${userId} offline, queuing newProblem notification`);
        const userNotifications = this.pendingNotifications.get(userId) || [];
        if (!userNotifications.some((n) => n.slug === slug)) {
          userNotifications.push(notification);
          this.pendingNotifications.set(userId, userNotifications);
        }
      }
    });

    this.notifiedProblems.add(slug);
  }

  async sendPendingNotifications(userId: string): Promise<void> {
    try {
      const notifications = this.pendingNotifications.get(userId) || [];
      if (notifications.length === 0) {
        console.log(`No pending notifications for user ${userId}`);
        return;
      }

      const socketId = this.io.sockets.adapter.rooms.get(userId)?.values().next().value;
      if (socketId) {
        console.log(`Sending ${notifications.length} pending notifications to user ${userId}`);
        notifications.forEach((notification) => {
          this.io.to(userId).emit(notification.type, notification);
        });
        this.pendingNotifications.delete(userId);
      }
    } catch (error) {
      console.error(`Error sending pending notifications for user ${userId}:`, error);
    }
  }

  clearNotifiedContest(contestId: string): void {
    this.notifiedContests.delete(contestId);
    console.log(`Cleared notified contest: ${contestId}`);
  }
}

export default NotificationService;