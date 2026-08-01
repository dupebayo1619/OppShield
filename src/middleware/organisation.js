const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getOrganisation = async (req, res, next) => {
  console.log('🚀 getOrganisation middleware STARTED');
  
  try {
    const userId = req.user?.id;
    console.log(`📌 User ID from req.user: ${userId}`);

    if (!userId) {
      console.log('❌ No userId found - returning 401');
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`🔍 Looking up membership for user: ${userId}`);
    
    const membership = await prisma.member.findFirst({
      where: { userId },
      include: { organisation: true }
    });

    console.log(`📊 Membership found: ${!!membership}`);

    if (!membership) {
      console.log('🆕 No membership found - creating new organisation');
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('❌ User not found in database');
        return res.status(401).json({ error: "User not found" });
      }

      const organisation = await prisma.organisation.create({
        data: {
          name: `${user.firstName}'s Organisation`,
          slug: `${user.email.split("@")[0]}-org`,
          plan: "FREE"
        }
      });

      await prisma.member.create({
        data: {
          userId,
          organisationId: organisation.id,
          role: "ADMIN"
        }
      });

      console.log(`✅ Created new organisation: ${organisation.id}`);
      req.organisation = organisation;
      return next();
    }

    console.log(`✅ Organisation found: ${membership.organisation.id}`);
    req.organisation = membership.organisation;
    next();
  } catch (error) {
    console.error('❌ Organisation middleware ERROR:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: "Failed to get organisation", details: error.message });
  }
};

module.exports = { getOrganisation };
