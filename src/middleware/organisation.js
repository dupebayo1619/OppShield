const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getOrganisation = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const membership = await prisma.member.findFirst({
      where: { userId },
      include: { organisation: true }
    });
    
    if (!membership) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
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
          role: "OWNER"
        }
      });
      
      req.organisation = organisation;
      return next();
    }
    
    req.organisation = membership.organisation;
    next();
  } catch (error) {
    console.error("Organisation middleware error:", error);
    res.status(500).json({ error: "Failed to get organisation" });
  }
};

module.exports = { getOrganisation };
