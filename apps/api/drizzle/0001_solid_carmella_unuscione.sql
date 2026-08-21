CREATE TABLE `accounts` (
	`user_id` int NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `sessions_session_token` PRIMARY KEY(`session_token`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE `competitions` ADD `format` varchar(50) DEFAULT 'round_robin' NOT NULL;--> statement-breakpoint
ALTER TABLE `competitions` ADD `is_private` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `competitions` ADD `entry_fee` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `competitions` ADD `prize_pool` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `competitions` ADD `start_date` timestamp;--> statement-breakpoint
ALTER TABLE `competitions` ADD `end_date` timestamp;--> statement-breakpoint
ALTER TABLE `modalities` ADD `is_team_based` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `modalities` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `image` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `role` varchar(50) DEFAULT 'player' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;