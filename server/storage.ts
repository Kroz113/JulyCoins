import { users, User, InsertUser, tasks, Task, InsertTask, submissions, Submission, InsertSubmission, auctions, Auction, InsertAuction, bids, Bid, InsertBid, transactions, Transaction, InsertTransaction } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  
  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  listTasks(): Promise<Task[]>;
  
  // Submissions
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionByTaskAndUser(taskId: number, userId: number): Promise<Submission | undefined>;
  listSubmissionsByTask(taskId: number): Promise<Submission[]>;
  listSubmissionsByUser(userId: number): Promise<Submission[]>;
  listPendingSubmissions(): Promise<Submission[]>;
  updateSubmissionStatus(id: number, status: string, coinsAwarded?: number): Promise<Submission>;
  
  // Auctions
  createAuction(auction: InsertAuction): Promise<Auction>;
  getAuction(id: number): Promise<Auction | undefined>;
  listActiveAuctions(): Promise<Auction[]>;
  listCompletedAuctions(): Promise<Auction[]>;
  completeAuction(id: number, winnerId: number, winningBid: number): Promise<Auction>;
  
  // Bids
  createBid(bid: InsertBid): Promise<Bid>;
  getBid(id: number): Promise<Bid | undefined>;
  getHighestBidForAuction(auctionId: number): Promise<Bid | undefined>;
  listBidsByAuction(auctionId: number): Promise<Bid[]>;
  listBidsByUser(userId: number): Promise<Bid[]>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactionsByUser(userId: number): Promise<Transaction[]>;
  getUserBalance(userId: number): Promise<number>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private submissions: Map<number, Submission>;
  private auctions: Map<number, Auction>;
  private bids: Map<number, Bid>;
  private transactions: Map<number, Transaction>;
  
  sessionStore: session.SessionStore;
  
  userIdCounter: number;
  taskIdCounter: number;
  submissionIdCounter: number;
  auctionIdCounter: number;
  bidIdCounter: number;
  transactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.submissions = new Map();
    this.auctions = new Map();
    this.bids = new Map();
    this.transactions = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    this.submissionIdCounter = 1;
    this.auctionIdCounter = 1;
    this.bidIdCounter = 1;
    this.transactionIdCounter = 1;
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // This will be hashed in the auth service
      email: "admin@julicoins.com",
      phone: "+56912345678",
      role: "admin"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Tasks
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = { ...insertTask, id, createdAt: now };
    this.tasks.set(id, task);
    return task;
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async listTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  // Submissions
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.submissionIdCounter++;
    const now = new Date();
    const submission: Submission = { 
      ...insertSubmission, 
      id, 
      createdAt: now, 
      status: "pending",
      coinsAwarded: null 
    };
    this.submissions.set(id, submission);
    return submission;
  }
  
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }
  
  async getSubmissionByTaskAndUser(taskId: number, userId: number): Promise<Submission | undefined> {
    return Array.from(this.submissions.values()).find(
      (submission) => submission.taskId === taskId && submission.userId === userId
    );
  }
  
  async listSubmissionsByTask(taskId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.taskId === taskId
    );
  }
  
  async listSubmissionsByUser(userId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.userId === userId
    );
  }
  
  async listPendingSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.status === "pending"
    );
  }
  
  async updateSubmissionStatus(id: number, status: string, coinsAwarded?: number): Promise<Submission> {
    const submission = this.submissions.get(id);
    if (!submission) {
      throw new Error(`Submission with id ${id} not found`);
    }
    
    const updatedSubmission: Submission = {
      ...submission,
      status,
      coinsAwarded: coinsAwarded !== undefined ? coinsAwarded : submission.coinsAwarded
    };
    
    this.submissions.set(id, updatedSubmission);
    
    // If approved and coins awarded, create a transaction
    if (status === "approved" && coinsAwarded) {
      const task = await this.getTask(submission.taskId);
      await this.createTransaction({
        userId: submission.userId,
        amount: coinsAwarded,
        type: "task_reward",
        description: `Reward for task: ${task?.title}`,
        relatedId: submission.taskId
      });
    }
    
    return updatedSubmission;
  }
  
  // Auctions
  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = this.auctionIdCounter++;
    const now = new Date();
    const auction: Auction = { 
      ...insertAuction, 
      id, 
      createdAt: now, 
      status: "active",
      winnerId: null,
      winningBid: null
    };
    this.auctions.set(id, auction);
    return auction;
  }
  
  async getAuction(id: number): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }
  
  async listActiveAuctions(): Promise<Auction[]> {
    const now = new Date();
    return Array.from(this.auctions.values()).filter(
      (auction) => auction.status === "active" && auction.endDate > now
    );
  }
  
  async listCompletedAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values()).filter(
      (auction) => auction.status === "completed"
    );
  }
  
  async completeAuction(id: number, winnerId: number, winningBid: number): Promise<Auction> {
    const auction = this.auctions.get(id);
    if (!auction) {
      throw new Error(`Auction with id ${id} not found`);
    }
    
    const updatedAuction: Auction = {
      ...auction,
      status: "completed",
      winnerId,
      winningBid
    };
    
    this.auctions.set(id, updatedAuction);
    
    // Create a transaction for the auction winner
    await this.createTransaction({
      userId: winnerId,
      amount: -winningBid,
      type: "auction_payment",
      description: `Payment for auction: ${auction.title}`,
      relatedId: auction.id
    });
    
    return updatedAuction;
  }
  
  // Bids
  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = this.bidIdCounter++;
    const now = new Date();
    const bid: Bid = { ...insertBid, id, createdAt: now };
    this.bids.set(id, bid);
    return bid;
  }
  
  async getBid(id: number): Promise<Bid | undefined> {
    return this.bids.get(id);
  }
  
  async getHighestBidForAuction(auctionId: number): Promise<Bid | undefined> {
    const auctionBids = await this.listBidsByAuction(auctionId);
    if (auctionBids.length === 0) {
      return undefined;
    }
    
    return auctionBids.reduce((prev, current) => 
      (prev.amount > current.amount) ? prev : current
    );
  }
  
  async listBidsByAuction(auctionId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.auctionId === auctionId
    );
  }
  
  async listBidsByUser(userId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(
      (bid) => bid.userId === userId
    );
  }
  
  // Transactions
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const transaction: Transaction = { ...insertTransaction, id, createdAt: now };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async listTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(trx => trx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserBalance(userId: number): Promise<number> {
    const transactions = await this.listTransactionsByUser(userId);
    return transactions.reduce((sum, trx) => sum + trx.amount, 0);
  }
}

export const storage = new MemStorage();
