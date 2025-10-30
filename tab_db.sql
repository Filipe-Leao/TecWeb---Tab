/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `tab` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `tab`;

DELIMITER //
CREATE PROCEDURE `AddMatch`(
	IN `p_player1_id` INT,
	IN `p_player2_id` INT,
	IN `p_winner` INT
)
BEGIN 
	INSERT INTO `matches`(player1_id, player2_id, winner)
	VALUES (p_username, p_player2_id, p_winner);
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE `CreatePlayer`(
	IN `p_username` VARCHAR(255),
	IN `p_password` VARCHAR(255),
	OUT `p_player_id` INT
)
BEGIN 
	INSERT INTO `players`(username, `password`)
	VALUES (p_username, p_password);
	SET p_player_id = LAST_INSERT_ID();
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE `GetLB`()
BEGIN 
	SELECT p.player_id AS id,
	 		 p.username AS username,
			 (
			 	SELECT COUNT(m.match_id)
			 	FROM `matches` m
			 	WHERE m.winner = p.player_id
			 ) AS victories,
			 (
			 	SELECT COUNT(m.match_id)
			 	FROM `matches` m
			 	WHERE m.winner != p.player_id AND 
				 		(m.player1_id = p.player_id OR m.player2_id = p.player_id)
			 ) AS defeats
	FROM `players` p
	ORDER BY victories DESC;
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE `LoginPlayer`(
	IN `p_username` VARCHAR(255)
)
BEGIN 
	SELECT p.player_id AS id,
	 		 p.username AS username,
			 p.`password` AS `password`
	FROM `players` p
	WHERE p.username = p_username;
END//
DELIMITER ;

CREATE TABLE IF NOT EXISTS `matches` (
  `match_id` int(11) NOT NULL AUTO_INCREMENT,
  `player1_id` int(11) NOT NULL,
  `player2_id` int(11) NOT NULL,
  `winner` int(11) DEFAULT 0,
  PRIMARY KEY (`match_id`),
  KEY `player1_id` (`player1_id`),
  KEY `player2_id` (`player2_id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`player1_id`) REFERENCES `players` (`player_id`),
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`player2_id`) REFERENCES `players` (`player_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELETE FROM `matches`;
INSERT INTO `matches` (`match_id`, `player1_id`, `player2_id`, `winner`) VALUES
	(1, 1, 2, 1);

CREATE TABLE IF NOT EXISTS `players` (
  `player_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`player_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELETE FROM `players`;
INSERT INTO `players` (`player_id`, `username`, `password`) VALUES
	(1, 'test1', 'a'),
	(2, 'test2', 'a'),
	(3, 'test3', 'a'),
	(4, 'filipe', '$2b$10$pLEiFUBZ5n4x7bAbbNdELOmHNaBRaNZH/29xbOYyk2YrJIe7AY2Va');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
