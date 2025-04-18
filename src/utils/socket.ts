import { Server, Socket } from "socket.io";
import http from "http";
import { CONFIG } from "../config/config";
import Discussion from "../models/DiscussionModel";

interface UserSocketMap {
  [userId: string]: string;
}

const userSocketMap: UserSocketMap = {};

export const getReceiverSocketId = (receiverId: string): string | undefined => {
  return userSocketMap[receiverId];
};

export const initializeSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: CONFIG.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      if (userId && userId in userSocketMap) delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    socket.on("joinProblemRoom", (problemId: string) => {
      socket.join(problemId);
      console.log(`User ${socket.id} joined room: ${problemId}`);
    });

    socket.on("newMessage", async (data: { problemId: string; message: any }) => {
      if (data.message && data.message._id && !data.message.userId?.userName) {
        const populatedMessage = await Discussion.findById(data.message._id)
          .populate("userId", "userName profileImage")
          .exec();
        io.to(data.problemId).emit("messageReceived", populatedMessage);
      } else {
        io.to(data.problemId).emit("messageReceived", data.message);
      }
    });

    socket.on("newReply", async (data: { problemId: string; reply: any }) => {
      if (data.reply && data.reply.discussionId && !data.reply.userId?.userName) {
        const populatedDiscussion = await Discussion.findById(data.reply.discussionId)
          .populate("replies.userId", "userName profileImage")
          .exec();
        const newReply = populatedDiscussion?.replies[populatedDiscussion.replies.length - 1];
        io.to(data.problemId).emit("replyReceived", { ...newReply, discussionId: data.reply.discussionId });
      } else {
        io.to(data.problemId).emit("replyReceived", data.reply);
      }
    });

    socket.on("upvoteDiscussion", (data: { discussionId: string; problemId: string }) => {
      io.to(data.problemId).emit("discussionUpvoted", { discussionId: data.discussionId });
    });

    socket.on("upvoteReply", (data: { discussionId: string; replyIndex: number; problemId: string }) => {
      io.to(data.problemId).emit("replyUpvoted", { discussionId: data.discussionId, replyIndex: data.replyIndex });
    });
  });

  return io;
};

export default initializeSocket;