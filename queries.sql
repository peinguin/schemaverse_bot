#nearest planets
SELECT
 *,
 location <-> (SELECT location FROM planets WHERE conqueror_id = get_player_id(SESSION_USER) LIMIT 1) dist
FROM planets WHERE
conqueror_id <> get_player_id(SESSION_USER)
ORDER BY location <-> (SELECT location FROM planets WHERE conqueror_id = get_player_id(SESSION_USER) LIMIT 1)
LIMIT 1

#move
SELECT SHIP_COURSE_CONTROL(id, max_speed, null, $1 )
FROM my_ships WHERE name LIKE 'conqueror%'; 
SELECT
	round((location <->$1)/2)::integer,
	SHIP_COURSE_CONTROL(id, round((location <->$1)/2)::integer, null, $1 )
FROM my_ships WHERE name LIKE 'conqueror%'

#watch
SELECT
	name,
	curr.tic,
	(curr.location <-> destination) dist,
	(current_fuel::float)/max_fuel*100 as pb_fuel,
	(current_health::float)/max_health*100 as pb_health,
	((prev.location <-> destination) - (curr.location <-> destination)) speed
FROM my_ships_flight_recorder curr, my_ships, my_ships_flight_recorder prev
WHERE
	my_ships.id = curr.ship_id AND
	my_ships.name LIKE 'conqueror%' AND
	prev.ship_id = curr.ship_id AND prev.tic = curr.tic - 1
ORder BY tic desc, my_ships.id

#upgrade
SELECT id,
   UPGRADE(id, 'MAX_HEALTH', 2), 
   UPGRADE(id, 'MAX_FUEL', 400), 
   UPGRADE(id, 'MAX_SPEED', 1600), 
   UPGRADE(id, 'RANGE', 10), 
   UPGRADE(id, 'DEFENSE', 1)
 FROM my_ships 
 WHERE name LIKE 'conqueror%'

#list
SELECT
	id, name, last_move_tic, (current_fuel::float)/max_fuel*100 as pb_fuel, max_speed, location, destination, speed, target_speed, action
FROM my_ships WHERE name LIKE 'conqueror%'
SELECT
	id, name, last_action_tic,last_move_tic,last_living_tic,max_speed,action,action_target_id,destination,location,target_speed,speed,target_direction,direction
FROM my_ships WHERE name LIKE 'conqueror%';

#in_range
SELECT DISTINCT ON (id) ships_in_range.* FROM ships_in_range

#autorepair
UPDATE my_ships SET action = 'REPAIR', action_target_id = id WHERE name LIKE 'conqueror%';

#events
SELECT  READ_EVENT(id) as Event  FROM my_events 
WHERE
	action not in ('MINE_SUCCESS','REPAIR', 'BUY_SHIP', 'REFUEL_SHIP', 'UPGRADE_SHIP') AND
	(player_id_1 = get_player_id(SESSION_USER) OR player_id_2 = get_player_id(SESSION_USER))
LIMIT 25;

SELECT
	get_player_username(event.player_id_1) player1,
	get_player_username(event.player_id_2) player2,
	ship1.name ship1, ship2.name ship2,
	event.action,
	descriptor_numeric,
	event.*
FROM my_events event
LEFT JOIN my_ships ship1 ON (ship1.id = event.ship_id_1)
LEFT JOIN my_ships ship2 ON (ship2.id = event.ship_id_2)
WHERE
	(player_id_1 = get_player_id(SESSION_USER) OR player_id_2 = get_player_id(SESSION_USER)) AND
	((ship1.name = 'attacker' AND event.action = 'MINE_SUCCESS') OR (event.action <> 'MINE_SUCCESS')) AND
	((ship1.name = 'attacker' AND event.action = 'ATTACK') OR (event.action <> 'ATTACK')) AND
	event.action not in ('REFUEL_SHIP', 'BUY_SHIP', 'UPGRADE_SHIP', 'REPAIR')
order by tic desc, id desc
LIMIT 10

#stop
SELECT SHIP_COURSE_CONTROL(id, speed, 360-direction, null )
FROM my_ships WHERE name LIKE 'conqueror%'; 