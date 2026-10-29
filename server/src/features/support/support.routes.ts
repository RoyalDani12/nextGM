import express from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import { verifyAccessToken } from "../auth/token.service.js";
import { notifyUser } from "../notification/notification.service.js";
import {
  sendTicketCreatedEmail,
  sendTicketStaffReplyEmail,
  sendTicketResolvedEmail,
} from "./support.email.js";

const router = express.Router();

function generateTicketNumber(): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${datePart}-${random}`;
}

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.enum([
    "ORDER_ISSUE",
    "PAYMENT_ISSUE",
    "ACCOUNT_ISSUE",
    "PRODUCT_ISSUE",
    "SHIPPING_ISSUE",
    "RETURN_ISSUE",
    "GENERAL",
    "OTHER",
  ]),
  message: z.string().trim().min(5).max(5000),
  guestName: z.string().trim().min(2).max(100).optional(),
  guestEmail: z.string().email().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

// POST /api/v1/support — submit ticket (public, with soft token detection)
router.post(
  "/",
  asyncHandler(async (req, res) => {
    let userId: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        if (token) {
          const payload = verifyAccessToken(token);
          if (payload?.userId) {
            userId = payload.userId;
          }
        }
      } catch {
        // guest mode
      }
    }

    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        "Validation error: " + parsed.error.issues.map((i) => i.message).join(", "),
        400
      );
    }

    const { subject, category, message, guestName, guestEmail, priority } = parsed.data;

    let senderName = guestName;
    let senderEmail = guestEmail;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (user) {
        senderName = user.name || user.email;
        senderEmail = user.email;
      } else {
        userId = undefined;
      }
    }

    if (!userId && (!guestName || !guestEmail)) {
      throw new AppError("Name and email are required for guest submissions.", 400);
    }

    const ticketNumber = generateTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject,
        category,
        priority: priority || "MEDIUM",
        userId: userId || null,
        guestName: !userId ? guestName : null,
        guestEmail: !userId ? guestEmail : null,
        messages: {
          create: {
            body: message,
            senderId: userId || null,
            isStaff: false,
            senderName: senderName || guestName || "Customer",
          },
        },
      },
      include: {
        messages: true,
      },
    });

    // Send confirmation email directly to the customer's inbox
    if (senderEmail) {
      sendTicketCreatedEmail({
        to: senderEmail,
        name: senderName || "Customer",
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        message,
      }).catch((err) => console.error("Ticket confirmation email delivery failed:", err));
    }

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully.",
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
      },
    });
  })
);

// GET /api/v1/support/my — customer: list my tickets
router.get(
  "/my",
  authenticate,
  asyncHandler(async (req, res) => {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.json({ success: true, data: tickets });
  })
);

// GET /api/v1/support/my/:ticketId — customer: get single ticket
router.get(
  "/my/:ticketId",
  authenticate,
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.ticketId as string,
        userId: req.user!.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) throw new AppError("Ticket not found.", 404);

    res.json({ success: true, data: ticket });
  })
);

// POST /api/v1/support/my/:ticketId/reply — customer: reply to ticket
router.post(
  "/my/:ticketId/reply",
  authenticate,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length < 1) {
      throw new AppError("Message is required.", 400);
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.ticketId as string,
        userId: req.user!.id,
      },
    });

    if (!ticket) throw new AppError("Ticket not found.", 404);
    if (ticket.status === "CLOSED") throw new AppError("This ticket is closed.", 400);

    const senderName = req.user!.name || "Customer";

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        body: message.trim(),
        senderId: req.user!.id,
        isStaff: false,
        senderName,
      },
    });

    const newStatus = ticket.status === "WAITING_CUSTOMER" ? "IN_PROGRESS" : ticket.status;
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data: msg });
  })
);

// --- ADMIN ROUTES ---

// GET /api/v1/support/admin — admin list tickets with filters & counts
router.get(
  "/admin",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new AppError("Forbidden.", 403);

    const status = req.query.status as string | undefined;
    const category = req.query.category as any;
    const priority = req.query.priority as any;
    const search = (req.query.search as string)?.trim();
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" } },
              { ticketNumber: { contains: search, mode: "insensitive" } },
              { guestEmail: { contains: search, mode: "insensitive" } },
              { guestName: { contains: search, mode: "insensitive" } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [tickets, total, statusCounts] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: "desc" }],
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    const counts = statusCounts.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        counts,
      },
    });
  })
);

// GET /api/v1/support/admin/:ticketId — admin: get single ticket
router.get(
  "/admin/:ticketId",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new AppError("Forbidden.", 403);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.ticketId as string },
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) throw new AppError("Ticket not found.", 404);

    res.json({ success: true, data: ticket });
  })
);

// PATCH /api/v1/support/admin/:ticketId — admin: update status / priority
router.patch(
  "/admin/:ticketId",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new AppError("Forbidden.", 403);

    const { status, priority, assignedToId } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;
    if (assignedToId !== undefined) data.assignedToId = assignedToId;
    if (status === "RESOLVED") data.resolvedAt = new Date();
    if (status === "OPEN" || status === "IN_PROGRESS") data.resolvedAt = null;

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.ticketId as string },
      data,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        resolvedAt: true,
        assignedToId: true,
        guestEmail: true,
        guestName: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (status === "RESOLVED") {
      const recipientEmail = ticket.user?.email || ticket.guestEmail;
      const recipientName = ticket.user?.name || ticket.guestName || "Customer";
      if (recipientEmail) {
        sendTicketResolvedEmail({
          to: recipientEmail,
          name: recipientName,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
        }).catch((err) => console.error("Ticket resolved email error:", err));
      }
    }

    res.json({ success: true, data: ticket });
  })
);

// POST /api/v1/support/admin/:ticketId/reply — admin reply
router.post(
  "/admin/:ticketId/reply",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "SUPER_ADMIN") throw new AppError("Forbidden.", 403);

    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length < 1) {
      throw new AppError("Message is required.", 400);
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.ticketId as string },
      select: {
        id: true,
        status: true,
        userId: true,
        subject: true,
        ticketNumber: true,
        guestEmail: true,
        guestName: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!ticket) throw new AppError("Ticket not found.", 404);
    if (ticket.status === "CLOSED") throw new AppError("Ticket is closed.", 400);

    const adminName = req.user!.name || "Support Team";

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        body: message.trim(),
        senderId: req.user!.id,
        isStaff: true,
        senderName: adminName,
      },
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: "WAITING_CUSTOMER",
        updatedAt: new Date(),
      },
    });

    // Send the reply directly to the customer's email inbox
    const recipientEmail = ticket.user?.email || ticket.guestEmail;
    const recipientName = ticket.user?.name || ticket.guestName || "Customer";
    if (recipientEmail) {
      sendTicketStaffReplyEmail({
        to: recipientEmail,
        name: recipientName,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        staffReply: message.trim(),
        staffName: adminName,
      }).catch((err) => console.error("Staff reply email dispatch error:", err));
    }

    if (ticket.userId) {
      try {
        await notifyUser({
          userId: ticket.userId,
          type: "RETURN_UPDATED",
          title: "Support team replied to your ticket 💬",
          body: `We've responded to your ticket: "${ticket.subject}". Check your email or support tickets for details.`,
        });
      } catch (err) {
        console.error("Failed to notify user of support reply:", err);
      }
    }

    res.status(201).json({ success: true, data: msg });
  })
);

export default router;
