/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50505
Source Host           : localhost:3306
Source Database       : psi-testserver

Target Server Type    : MYSQL
Target Server Version : 50505
File Encoding         : 65001

Date: 2021-11-17 21:25:31
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `psi_event`
-- ----------------------------
DROP TABLE IF EXISTS `psi_event`;
CREATE TABLE `psi_event` (
  `event_id` int(10) NOT NULL AUTO_INCREMENT,
  `event_name` varchar(128) DEFAULT NULL,
  `event_description` blob DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `event_type` varchar(20) NOT NULL,
  `event_ingress` blob DEFAULT NULL,
  `event_status` varchar(16) DEFAULT '',
  `event_privacy` varchar(11) DEFAULT NULL,
  `domain_id` int(11) DEFAULT NULL,
  `event_place` varchar(64) DEFAULT NULL,
  `header_image` varchar(64) DEFAULT NULL,
  `event_arranger_id` int(11) DEFAULT NULL,
  `event_instructor_id` int(11) DEFAULT NULL,
  `event_max_users` int(11) DEFAULT NULL,
  `event_date_start` datetime DEFAULT NULL,
  `event_date_end` datetime DEFAULT NULL,
  `event_date_join` datetime DEFAULT NULL,
  `event_date_pay` datetime DEFAULT NULL,
  `event_price` int(11) DEFAULT 0,
  `event_url` blob DEFAULT NULL,
  `salary_number` int(11) DEFAULT 0,
  `salary_minimum` int(11) DEFAULT 0,
  `salary_maximum` int(11) DEFAULT 0,
  `rent` int(11) DEFAULT 0,
  PRIMARY KEY (`event_id`)
) ENGINE=MyISAM AUTO_INCREMENT=921253 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of psi_event
-- ----------------------------
INSERT INTO `psi_event` VALUES ('3', 'Tour de France', 0x736467646667736466676873646668646768, '0', '', null, '1', null, null, '0', null, null, null, null, '2018-07-06 00:00:00', null, null, null, '777', 0x616161, null, null, null, null);
INSERT INTO `psi_event` VALUES ('6', 'Stage 2 TDF', 0x266C743B702667743B6173646673646667736467266C743B2F702667743B, '3', '', null, '0', null, null, '0', null, null, null, null, '2018-07-08 00:00:00', null, null, null, null, 0x626262, null, null, null, null);
INSERT INTO `psi_event` VALUES ('5', 'Catalonia rundt', 0x636174616361746163617461, null, '', null, '0', null, null, '0', null, null, null, null, '2018-07-18 00:00:00', null, null, null, null, 0x636363, null, null, null, null);
INSERT INTO `psi_event` VALUES ('4', 'Stage 1 TDF', null, '3', '', null, '0', null, null, '0', null, null, null, null, '2018-07-09 00:00:00', null, null, null, null, 0x646464, null, null, null, null);
INSERT INTO `psi_event` VALUES ('2', 'Giro dItalia', 0x786664686766682E20595978, null, '', null, '0', null, null, '0', null, null, null, null, '2005-05-04 00:00:00', null, null, null, null, null, null, null, null, null);
INSERT INTO `psi_event` VALUES ('11', 'Stage 1 giro', null, '2', '', null, null, null, null, null, null, null, null, null, '2020-05-07 00:00:00', null, null, null, null, null, null, null, null, null);
INSERT INTO `psi_event` VALUES ('7', 'Stage 2B TDF', null, '6', '', null, '0', null, null, '1', null, null, null, null, null, null, null, null, '0', null, '0', '0', '0', '0');
INSERT INTO `psi_event` VALUES ('15', 'Groupless race', null, null, '', null, null, null, null, null, null, null, null, null, null, null, null, null, '0', null, '0', '0', '0', '0');
INSERT INTO `psi_event` VALUES ('921251', 'dfjhfjhfghnj', null, null, '', null, '', null, null, null, null, null, null, null, null, null, null, null, '0', null, '0', '0', '0', '0');
INSERT INTO `psi_event` VALUES ('921252', 'gsthbtsa', null, null, '', null, '', null, null, null, null, null, null, null, null, null, null, null, '0', null, '0', '0', '0', '0');
