CREATE TABLE `clubs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`tag` varchar(5) NOT NULL,
	`logo_url` varchar(500),
	`location` varchar(255),
	`president_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `clubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`modality_id` int,
	`organizer_id` int,
	`rules_json` json,
	`status` varchar(50) DEFAULT 'planned',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `competitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modalities` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	CONSTRAINT `modalities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nickname` varchar(100),
	`email` varchar(255) NOT NULL,
	`location` varchar(255),
	`birth_date` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_nickname_unique` UNIQUE(`nickname`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `clubs` ADD CONSTRAINT `clubs_president_id_users_id_fk` FOREIGN KEY (`president_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_modality_id_modalities_id_fk` FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_organizer_id_users_id_fk` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;