import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";
import { writePrivateFile } from "../src/lib/storage.js";

const prisma = new PrismaClient();

async function main() {
  const email = (
    process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@mealmate.local"
  ).toLowerCase();
  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "ChangeMe-Admin-2026!";

  if (password.length < 12) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters");
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName: "MealMate Admin",
      isActive: true,
    },
    create: {
      email,
      fullName: "MealMate Admin",
      passwordHash,
      isActive: true,
      roles: { create: { role: "admin" } },
    },
    include: { roles: true },
  });

  if (!admin.roles.some((r) => r.role === "admin")) {
    await prisma.userRole.create({
      data: { userId: admin.id, role: "admin" },
    });
  }

  await prisma.mealSlot.upsert({
    where: { code: "breakfast" },
    update: {},
    create: {
      code: "breakfast",
      displayName: "Breakfast",
      cutoffHour: 21,
      cutoffMinute: 0,
      cutoffPrevDay: true,
    },
  });
  await prisma.mealSlot.upsert({
    where: { code: "lunch" },
    update: {},
    create: {
      code: "lunch",
      displayName: "Lunch",
      cutoffHour: 9,
      cutoffMinute: 0,
      cutoffPrevDay: false,
    },
  });
  await prisma.mealSlot.upsert({
    where: { code: "dinner" },
    update: {},
    create: {
      code: "dinner",
      displayName: "Dinner",
      cutoffHour: 15,
      cutoffMinute: 0,
      cutoffPrevDay: false,
    },
  });

  const area = await prisma.serviceArea.upsert({
    where: { code: "noida-sector-62" },
    update: {},
    create: {
      name: "Noida Sector 62",
      code: "noida-sector-62",
      description: "Pilot locality placeholder",
      isActive: true,
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "ops_policy" },
    update: {},
    create: {
      key: "ops_policy",
      value: {
        cancellationCutoffMinutes: 60,
        refundWindowHours: 24,
        deliveryFeePaise: 2000,
        platformFeePaise: 500,
      },
    },
  });

  // Demo kitchen partner + customer + order for admin UI
  const partnerUser = await prisma.user.upsert({
    where: { email: "kitchen.demo@mealmate.local" },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      email: "kitchen.demo@mealmate.local",
      fullName: "Demo Kitchen Owner",
      passwordHash,
      phone: "+919999000001",
      isActive: true,
      roles: { create: { role: "kitchen_partner" } },
    },
  });

  const partner = await prisma.kitchenPartner.upsert({
    where: { userId: partnerUser.id },
    update: { status: "approved" },
    create: {
      userId: partnerUser.id,
      businessName: "Ghar Ka Khana — Sector 62",
      contactEmail: "kitchen.demo@mealmate.local",
      contactPhone: "+919999000001",
      status: "approved",
      serviceAreas: { create: { serviceAreaId: area.id } },
    },
  });

  const menu = await prisma.menu.upsert({
    where: { id: "seed-menu-demo" },
    update: { isPublished: true },
    create: {
      id: "seed-menu-demo",
      partnerId: partner.id,
      title: "Daily Homestyle Specials",
      isPublished: true,
      items: {
        create: [
          {
            name: "Classic Veg Thali",
            description: "2 seasonal sabzi, yellow dal tadka, 4 phulkas, jeera rice, salad & pickle",
            pricePaise: 9900,
            isVeg: true,
            allergens: "Gluten, Dairy",
            dailyCapacity: 45,
            isAvailable: true,
          },
          {
            name: "Paneer Butter Masala Meal",
            description: "Shahi paneer, dal makhani, 3 butter rotis, aromatic pulao, sweet gulab jamun",
            pricePaise: 13900,
            isVeg: true,
            allergens: "Dairy, Nuts",
            dailyCapacity: 30,
            isAvailable: true,
          },
          {
            name: "Comfort Dal Khichdi Bowl",
            description: "Moong dal khichdi tempered in desi ghee, served with curd, roasted papad & pickle",
            pricePaise: 8900,
            isVeg: true,
            allergens: "Dairy",
            dailyCapacity: 25,
            isAvailable: true,
          },
        ],
      },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer.demo@mealmate.local" },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      email: "customer.demo@mealmate.local",
      fullName: "Demo Customer",
      passwordHash,
      phone: "+919999000002",
      isActive: true,
      roles: { create: { role: "customer" } },
    },
  });

  const address = await prisma.customerAddress.create({
    data: {
      userId: customer.id,
      label: "PG",
      line1: "House 12, Near Metro",
      pgName: "Sunrise PG",
      roomFlat: "204",
      landmark: "Opposite park",
      serviceAreaId: area.id,
      isDefault: true,
    },
  });

  const lunch = await prisma.mealSlot.findUniqueOrThrow({
    where: { code: "lunch" },
  });

  const existingOrder = await prisma.order.findFirst({
    where: { idempotencyKey: "seed-order-1" },
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        customerId: customer.id,
        partnerId: partner.id,
        addressId: address.id,
        serviceAreaId: area.id,
        mealSlotId: lunch.id,
        status: "placed",
        subtotalPaise: 9900,
        deliveryFeePaise: 2000,
        platformFeePaise: 500,
        taxPaise: 0,
        totalPaise: 12400,
        idempotencyKey: "seed-order-1",
        deliveryDate: new Date(),
        items: {
          create: [
            {
              menuItemId: null,
              nameSnapshot: "Veg Thali",
              pricePaiseSnapshot: 9900,
              quantity: 1,
            },
          ],
        },
        statusHistory: {
          create: [
            { fromStatus: null, toStatus: "pending_payment", note: "seed" },
            {
              fromStatus: "pending_payment",
              toStatus: "placed",
              note: "seed payment ok",
            },
          ],
        },
      },
    });
  }

  const seedOrder = await prisma.order.findFirst({
    where: { idempotencyKey: "seed-order-1" },
  });
  if (seedOrder) {
    const existingTicket = await prisma.supportTicket.findFirst({
      where: { orderId: seedOrder.id, subject: "Late delivery yesterday" },
    });
    if (!existingTicket) {
      await prisma.supportTicket.create({
        data: {
          requesterId: customer.id,
          orderId: seedOrder.id,
          subject: "Late delivery yesterday",
          body: "Lunch arrived 40 minutes late. Please look into this.",
          status: "open",
          priority: "medium",
        },
      });
    }

    let payment = await prisma.payment.findFirst({
      where: { idempotencyKey: "seed-payment-1" },
    });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId: seedOrder.id,
          provider: "demo_gateway",
          providerRef: "pay_demo_seed_1",
          amountPaise: seedOrder.totalPaise,
          currency: "INR",
          status: "succeeded",
          idempotencyKey: "seed-payment-1",
        },
      });
    }

    const existingRefund = await prisma.refund.findFirst({
      where: { orderId: seedOrder.id, reason: "Late delivery compensation" },
    });
    if (!existingRefund) {
      await prisma.refund.create({
        data: {
          paymentId: payment.id,
          orderId: seedOrder.id,
          amountPaise: 2000,
          reason: "Late delivery compensation",
          status: "requested",
        },
      });
    }

    const existingDelivery = await prisma.deliveryTask.findUnique({
      where: { orderId: seedOrder.id },
    });
    if (!existingDelivery) {
      await prisma.deliveryTask.create({
        data: {
          orderId: seedOrder.id,
          status: "unassigned",
        },
      });
    }
  }

  const storageKey = `partners/${partner.id}/fssai-demo.txt`;
  await writePrivateFile(
    storageKey,
    "MealMate private document demo — FSSAI certificate placeholder. Not for public access.\n",
  );
  const existingDoc = await prisma.partnerDocument.findFirst({
    where: { partnerId: partner.id, storageKey },
  });
  if (!existingDoc) {
    await prisma.partnerDocument.create({
      data: {
        partnerId: partner.id,
        docType: "fssai",
        storageKey,
        originalName: "fssai-demo.txt",
        mimeType: "text/plain",
      },
    });
  }

  console.log("Seed complete");
  console.log(`Admin email: ${email}`);
  console.log("Admin password: (from ADMIN_BOOTSTRAP_PASSWORD or default in .env.example)");
  console.log(`Demo menu id: ${menu.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
