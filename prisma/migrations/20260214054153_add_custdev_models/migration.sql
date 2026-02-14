-- CreateTable
CREATE TABLE `CustDevSurvey` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `aiAnalysis` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `startupId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CustDevSurvey_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustDevQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `options` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `required` BOOLEAN NOT NULL DEFAULT true,
    `surveyId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustDevResponse` (
    `id` VARCHAR(191) NOT NULL,
    `respondentName` VARCHAR(191) NULL,
    `respondentEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `surveyId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustDevAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `responseId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustDevSurvey` ADD CONSTRAINT `CustDevSurvey_startupId_fkey` FOREIGN KEY (`startupId`) REFERENCES `Startup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustDevQuestion` ADD CONSTRAINT `CustDevQuestion_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `CustDevSurvey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustDevResponse` ADD CONSTRAINT `CustDevResponse_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `CustDevSurvey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustDevAnswer` ADD CONSTRAINT `CustDevAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `CustDevQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustDevAnswer` ADD CONSTRAINT `CustDevAnswer_responseId_fkey` FOREIGN KEY (`responseId`) REFERENCES `CustDevResponse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
