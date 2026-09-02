const { PrismaClient } = require('./generated/panel');
const prisma = new PrismaClient();

async function main() {
    console.log("Listing Permissions...");
    const perms = await prisma.permissions.findMany({
        take: 100,
        orderBy: { id: 'desc' }
    });
    console.log(JSON.stringify(perms, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
