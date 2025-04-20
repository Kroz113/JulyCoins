import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { comparePasswords } from "./auth";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(storedPassword: string, suppliedPassword: string): Promise<boolean> {
  const [salt, hashedPassword] = storedPassword.split(":");
  if (!salt || !hashedPassword) {
    throw new Error("Invalid stored password format");
  }

  return new Promise((resolve, reject) => {
    scrypt(suppliedPassword, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === hashedPassword);
    });
  });
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "julicoins-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isMatch = await comparePasswords(user.password, password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, username, phone, role = "student" } = req.body;
      
      if (!email || !password || !username || !phone) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Only allow admin creation if current user is admin
      if (role === "admin" && (!req.user || req.user.role !== "admin")) {
        return res.status(403).json({ message: "Unauthorized to create admin users" });
      }
      
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        phone,
        role
      });
      
      // Don't send the password back
      const { password: _, ...userWithoutPassword } = user;
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isMatch = await comparePasswords(user.password, password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Autenticación exitosa
      res.json({ message: "Login successful", user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        req.logout((err) => {
          if (err) {
            console.error("Error logging out user:", err);
          }
        });
        return res.status(401).json({ message: "User not found" });
      }
      
      // Add user balance
      const balance = await storage.getUserBalance(user.id);
      
      // Don't send the password back
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        ...userWithoutPassword,
        balance
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Middleware to check if the user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if the user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}
