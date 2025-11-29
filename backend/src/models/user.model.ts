import prisma from '../config/prisma';

export const userModel = {
  findByEmailorUsername: async (email: string, username: string) => {
    /*return prisma.user.findUnique({ where: { email } });*/
    return { password: 1234, id: 0 };
  },

  createUser: async (data: { username: string, email: string, password: string, age: number, gender: string, height: number, weight: number, target_weight: number, reason_to_diet: string, avatar_url: string }) => {
    /*return prisma.user.create({ data })*/;
  },

  updateUserById: async (id: number) => {

  }
};
