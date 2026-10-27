import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const [mode, childId, parentId] = process.argv.slice(2);
  if (mode === 'link') {
    await prisma.room.update({ where: { id: childId }, data: { parentRoomId: parentId } });
    console.log('linked');
  } else if (mode === 'unlink') {
    await prisma.room.update({ where: { id: childId }, data: { parentRoomId: null } });
    console.log('unlinked');
  }
}
main().finally(() => prisma.$disconnect());
