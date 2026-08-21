ALTER TABLE `competition_registrations` DROP FOREIGN KEY `competition_registrations_competition_id_competitions_id_fk`;
--> statement-breakpoint
ALTER TABLE `competition_registrations` DROP FOREIGN KEY `competition_registrations_club_id_clubs_id_fk`;
--> statement-breakpoint
ALTER TABLE `competition_rosters` DROP FOREIGN KEY `competition_rosters_registration_id_competition_registrations_id_fk`;
--> statement-breakpoint
ALTER TABLE `competition_rosters` DROP FOREIGN KEY `competition_rosters_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `competition_registrations` ADD CONSTRAINT `comp_reg_comp_id_fk` FOREIGN KEY (`competition_id`) REFERENCES `competitions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_registrations` ADD CONSTRAINT `comp_reg_club_id_fk` FOREIGN KEY (`club_id`) REFERENCES `clubs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_rosters` ADD CONSTRAINT `comp_rost_reg_id_fk` FOREIGN KEY (`registration_id`) REFERENCES `competition_registrations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competition_rosters` ADD CONSTRAINT `comp_rost_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;