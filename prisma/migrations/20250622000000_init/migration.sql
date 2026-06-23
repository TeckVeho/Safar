-- CreateTable
CREATE TABLE `product` (
    `jan` VARCHAR(13) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `ingredients_raw` TEXT NULL,
    `flags` JSON NULL,
    `verdict` ENUM('ok', 'avoid', 'maybe') NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`jan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ng_ingredient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` ENUM('pork', 'alcohol', 'gelatin', 'other') NOT NULL,
    `term` VARCHAR(100) NOT NULL,
    `note` VARCHAR(255) NULL,

    INDEX `ng_ingredient_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phrase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` ENUM('tenko', 'denpyo', 'niyaku', 'ninushi', 'jiko') NOT NULL,
    `ja` TEXT NOT NULL,
    `ru` TEXT NOT NULL,
    `uz` TEXT NULL,

    INDEX `phrase_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `address` VARCHAR(255) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;