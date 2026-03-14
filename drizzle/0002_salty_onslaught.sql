CREATE TABLE `club_invitations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`club_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`modality_id` bigint unsigned NOT NULL,
	`type` varchar(20) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`message` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `club_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `club_members` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`club_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`modality_id` bigint unsigned NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'player',
	`joined_at` timestamp DEFAULT (now()),
	CONSTRAINT `club_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competition_registrations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`competition_id` bigint unsigned NOT NULL,
	`club_id` bigint unsigned NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `competition_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competition_rosters` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`registration_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `competition_rosters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leagues` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`tag` varchar(10) NOT NULL,
	`description` text,
	`logo_url` varchar(500),
	`president_id` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `leagues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_modalities` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`modality_id` bigint unsigned NOT NULL,
	`primary_position_id` bigint unsigned,
	`secondary_position_id` bigint unsigned,
	`joined_at` timestamp DEFAULT (now()),
	CONSTRAINT `player_modalities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_profiles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`bio` text,
	`avatar_url` varchar(500),
	`banner_url` varchar(500),
	`active_modality_id` bigint unsigned,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `player_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `player_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`modality_id` bigint unsigned NOT NULL,
	`name` varchar(100) NOT NULL,
	`abbreviation` varchar(10),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stat_types` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`modality_id` bigint unsigned NOT NULL,
	`name` varchar(100) NOT NULL,
	`unit` varchar(30),
	`is_higher_better` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `stat_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `user_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `clubs` MODIFY COLUMN `president_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `competitions` MODIFY COLUMN `modality_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `competitions` MODIFY COLUMN `organizer_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `user_id` bigint unsigned NOT NULL;--> statement-breakpoint
ALTER TABLE `clubs` ADD `modality_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `competitions` ADD `league_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `competitions` ADD `max_teams` int;--> statement-breakpoint
ALTER TABLE `competitions` ADD `min_players_per_team` int;--> statement-breakpoint
ALTER TABLE `competitions` ADD `max_players_per_team` int;--> statement-breakpoint
ALTER TABLE `competitions` ADD `registration_start_date` timestamp;--> statement-breakpoint
ALTER TABLE `competitions` ADD `registration_end_date` timestamp;--> statement-breakpoint
ALTER TABLE `competitions` ADD `registration_windows` json;--> statement-breakpoint
ALTER TABLE `modalities` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `club_invitations` ADD CONSTRAINT `club_invitations_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_invitations` ADD CONSTRAINT `club_invitations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_invitations` ADD CONSTRAINT `club_invitations_modality_id_modalities_id_fk` FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_members` ADD CONSTRAINT `club_members_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_members` ADD CONSTRAINT `club_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club_members` ADD CONSTRAINT `club_members_modality_id_modalities_id_fk` FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_registrations` ADD CONSTRAINT `competition_registrations_competition_id_competitions_id_fk` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_registrations` ADD CONSTRAINT `competition_registrations_club_id_clubs_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_rosters` ADD CONSTRAINT `competition_rosters_registration_id_competition_registrations_id_fk` FOREIGN KEY (`registration_id`) REFERENCES `competition_registrations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_rosters` ADD CONSTRAINT `competition_rosters_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leagues` ADD CONSTRAINT `leagues_president_id_users_id_fk` FOREIGN KEY (`president_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_modalities` ADD CONSTRAINT `player_modalities_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_modalities` ADD CONSTRAINT `player_modalities_modality_id_modalities_id_fk` FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_modalities` ADD CONSTRAINT `player_modalities_primary_position_id_positions_id_fk` FOREIGN KEY (`primary_position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_modalities` ADD CONSTRAINT `player_modalities_secondary_position_id_positions_id_fk` FOREIGN KEY (`secondary_position_id`) REFERENCES `positions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD CONSTRAINT `player_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD CONSTRAINT `player_profiles_active_modality_id_modalities_id_fk` FOREIGN KEY (`active_modality_id`) REFERENCES `modalities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `positions` ADD CONSTRAINT `positions_modality_id_modalities_id_fk` FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stat_types` ADD CONSTRAINT `stat_types_modality_id_modalities_id_fk` FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clubs` ADD CONSTRAINT `clubs_modality_id_modalities_id_fk` FOREIGN KEY (`modality_id`) REFERENCES `modalities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competitions` ADD CONSTRAINT `competitions_league_id_leagues_id_fk` FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON DELETE no action ON UPDATE no action;