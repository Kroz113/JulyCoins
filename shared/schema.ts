import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow()
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  coinsReward: integer("coins_reward").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull()
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  comment: text("comment"),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  coinsAwarded: integer("coins_awarded"),
  createdAt: timestamp("created_at").defaultNow()
});

export const auctions = pgTable("auctions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  minimumBid: integer("minimum_bid").notNull(),
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("active"), // active, completed
  winnerId: integer("winner_id"),
  winningBid: integer("winning_bid"),
  createdAt: timestamp("created_at").defaultNow()
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // task_reward, auction_win, auction_payment
  description: text("description").notNull(),
  relatedId: integer("related_id"), // task_id or auction_id
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, createdAt: true, status: true, coinsAwarded: true });
export const insertAuctionSchema = createInsertSchema(auctions).omit({ id: true, createdAt: true, status: true, winnerId: true, winningBid: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctions.$inferSelect;

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Extended types for API responses
export type TaskWithSubmission = Task & {
  hasSubmitted?: boolean;
  submission?: Submission;
};

export type AuctionWithBids = Auction & {
  bids: Bid[];
  highestBid?: Bid;
  userBid?: Bid;
};

export type UserWithCoins = User & {
  totalCoins: number;
};
