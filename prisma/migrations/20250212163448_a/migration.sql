/*
  Warnings:

  - A unique constraint covering the columns `[celular]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `cantidad` INTEGER NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `User_celular_key` ON `User`(`celular`);
