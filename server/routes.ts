import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

// Setup file storage
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${nanoid()}-${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage: storage2,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF and Word documents are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));
  
  // Users API
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      
      // Don't send passwords
      const usersWithBalance = await Promise.all(
        users.map(async (user) => {
          const { password, ...userWithoutPassword } = user;
          const balance = await storage.getUserBalance(user.id);
          return { ...userWithoutPassword, balance };
        })
      );
      
      res.json(usersWithBalance);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Tasks API
  app.post("/api/tasks", isAdmin, async (req, res) => {
    try {
      const { title, description, dueDate, coinsReward } = req.body;
      
      if (!title || !description || !dueDate || !coinsReward) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const task = await storage.createTask({
        title,
        description,
        dueDate: new Date(dueDate),
        coinsReward: Number(coinsReward),
        createdBy: req.user.id
      });
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.listTasks();
      
      // If student, also check if they've submitted each task
      if (req.user.role === "student") {
        const tasksWithSubmissions = await Promise.all(tasks.map(async (task) => {
          const submission = await storage.getSubmissionByTaskAndUser(task.id, req.user.id);
          return {
            ...task,
            hasSubmitted: !!submission,
            submission: submission
          };
        }));
        
        return res.json(tasksWithSubmissions);
      }
      
      res.json(tasks);
    } catch (error) {
      console.error("Error listing tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTask(Number(req.params.id));
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // If student, also check if they've submitted this task
      if (req.user.role === "student") {
        const submission = await storage.getSubmissionByTaskAndUser(task.id, req.user.id);
        return res.json({
          ...task,
          hasSubmitted: !!submission,
          submission: submission
        });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error getting task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Submissions API
  app.post("/api/submissions", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const { taskId, title, comment } = req.body;
      
      if (!taskId || !title || !req.file) {
        return res.status(400).json({ message: "TaskId, title and file are required" });
      }
      
      const task = await storage.getTask(Number(taskId));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user already submitted this task
      const existingSubmission = await storage.getSubmissionByTaskAndUser(Number(taskId), req.user.id);
      if (existingSubmission) {
        return res.status(400).json({ message: "You have already submitted this task" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      
      const submission = await storage.createSubmission({
        taskId: Number(taskId),
        userId: req.user.id,
        title,
        comment: comment || null,
        fileUrl
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/submissions", isAuthenticated, async (req, res) => {
    try {
      let submissions = [];
      
      if (req.user.role === "admin") {
        submissions = await storage.listPendingSubmissions();
      } else {
        submissions = await storage.listSubmissionsByUser(req.user.id);
      }
      
      // Get task details for each submission
      const submissionsWithTasks = await Promise.all(submissions.map(async (submission) => {
        const task = await storage.getTask(submission.taskId);
        return {
          ...submission,
          task
        };
      }));
      
      res.json(submissionsWithTasks);
    } catch (error) {
      console.error("Error listing submissions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/submissions/:id", isAdmin, async (req, res) => {
    try {
      const { status, coinsAwarded } = req.body;
      
      if (!status || (status === "approved" && coinsAwarded === undefined)) {
        return res.status(400).json({ message: "Status and coinsAwarded (if approving) are required" });
      }
      
      const submission = await storage.getSubmission(Number(req.params.id));
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const updatedSubmission = await storage.updateSubmissionStatus(
        Number(req.params.id),
        status,
        status === "approved" ? Number(coinsAwarded) : undefined
      );
      
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Auctions API
  app.post("/api/auctions", isAdmin, async (req, res) => {
    try {
      const { title, description, startDate, endDate, minimumBid } = req.body;
      
      if (!title || !description || !startDate || !endDate || !minimumBid) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const auction = await storage.createAuction({
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minimumBid: Number(minimumBid),
        createdBy: req.user.id
      });
      
      res.status(201).json(auction);
    } catch (error) {
      console.error("Error creating auction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/auctions", isAuthenticated, async (req, res) => {
    try {
      const activeAuctions = await storage.listActiveAuctions();
      
      // Get bids for each auction
      const auctionsWithBids = await Promise.all(activeAuctions.map(async (auction) => {
        const bids = await storage.listBidsByAuction(auction.id);
        const highestBid = bids.length > 0 
          ? bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) 
          : undefined;
        
        // If student, get their bid
        let userBid;
        if (req.user.role === "student") {
          userBid = bids.find(bid => bid.userId === req.user.id);
        }
        
        return {
          ...auction,
          bids,
          highestBid,
          userBid
        };
      }));
      
      res.json(auctionsWithBids);
    } catch (error) {
      console.error("Error listing auctions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/auctions/:id", isAuthenticated, async (req, res) => {
    try {
      const auction = await storage.getAuction(Number(req.params.id));
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      const bids = await storage.listBidsByAuction(auction.id);
      const highestBid = bids.length > 0 
        ? bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) 
        : undefined;
      
      // If student, get their bid
      let userBid;
      if (req.user.role === "student") {
        userBid = bids.find(bid => bid.userId === req.user.id);
      }
      
      res.json({
        ...auction,
        bids,
        highestBid,
        userBid
      });
    } catch (error) {
      console.error("Error getting auction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auctions/:id/close", isAdmin, async (req, res) => {
    try {
      const auction = await storage.getAuction(Number(req.params.id));
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.status === "completed") {
        return res.status(400).json({ message: "Auction is already completed" });
      }
      
      const highestBid = await storage.getHighestBidForAuction(auction.id);
      
      if (!highestBid) {
        return res.status(400).json({ message: "No bids for this auction" });
      }
      
      const completedAuction = await storage.completeAuction(
        auction.id,
        highestBid.userId,
        highestBid.amount
      );
      
      res.json(completedAuction);
    } catch (error) {
      console.error("Error closing auction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Bids API
  app.post("/api/bids", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can place bids" });
      }
      
      const { auctionId, amount } = req.body;
      
      if (!auctionId || !amount) {
        return res.status(400).json({ message: "AuctionId and amount are required" });
      }
      
      const auction = await storage.getAuction(Number(auctionId));
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      
      if (auction.status !== "active") {
        return res.status(400).json({ message: "Auction is not active" });
      }
      
      const now = new Date();
      if (now < auction.startDate || now > auction.endDate) {
        return res.status(400).json({ message: "Auction is not in progress" });
      }
      
      const bidAmount = Number(amount);
      
      if (bidAmount < auction.minimumBid) {
        return res.status(400).json({ 
          message: `Bid must be at least ${auction.minimumBid} JuliCoins` 
        });
      }
      
      // Check if user has enough coins
      const userBalance = await storage.getUserBalance(req.user.id);
      
      if (userBalance < bidAmount) {
        return res.status(400).json({ 
          message: `Not enough JuliCoins. Your balance: ${userBalance}` 
        });
      }
      
      // Check if this is the highest bid
      const highestBid = await storage.getHighestBidForAuction(auction.id);
      
      if (highestBid && bidAmount <= highestBid.amount) {
        return res.status(400).json({ 
          message: `Bid must be higher than current highest bid: ${highestBid.amount} JuliCoins` 
        });
      }
      
      const bid = await storage.createBid({
        auctionId: Number(auctionId),
        userId: req.user.id,
        amount: bidAmount
      });
      
      res.status(201).json(bid);
    } catch (error) {
      console.error("Error creating bid:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Transactions API
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.listTransactionsByUser(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error listing transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/:id/transactions", isAdmin, async (req, res) => {
    try {
      const transactions = await storage.listTransactionsByUser(Number(req.params.id));
      res.json(transactions);
    } catch (error) {
      console.error("Error listing user transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Dashboard stats
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      const students = users.filter(user => user.role === "student");
      
      // Calculate total coins in circulation
      let totalCoins = 0;
      for (const student of students) {
        totalCoins += await storage.getUserBalance(student.id);
      }
      
      const tasks = await storage.listTasks();
      const pendingSubmissions = await storage.listPendingSubmissions();
      const activeAuctions = await storage.listActiveAuctions();
      
      res.json({
        totalCoins,
        totalStudents: students.length,
        totalTasks: tasks.length,
        pendingSubmissions: pendingSubmissions.length,
        activeAuctions: activeAuctions.length
      });
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/student/stats", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can access this endpoint" });
      }
      
      const balance = await storage.getUserBalance(req.user.id);
      const submissions = await storage.listSubmissionsByUser(req.user.id);
      const completedSubmissions = submissions.filter(sub => sub.status === "approved");
      
      // Calculate total earned
      const totalEarned = completedSubmissions.reduce((sum, sub) => sum + (sub.coinsAwarded || 0), 0);
      
      // Get auction wins
      const completedAuctions = await storage.listCompletedAuctions();
      const auctionWins = completedAuctions.filter(auction => auction.winnerId === req.user.id);
      
      res.json({
        balance,
        completedTasks: completedSubmissions.length,
        totalEarned,
        auctionWins: auctionWins.length
      });
    } catch (error) {
      console.error("Error getting student stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
