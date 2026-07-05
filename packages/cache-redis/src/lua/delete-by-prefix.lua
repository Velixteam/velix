-- delete-by-prefix.lua
-- Supprime toutes les clés correspondant à un préfixe via SCAN (non-bloquant)
-- KEYS[1] = pattern de préfixe (ex: "velix:route:/about*")
-- Retourne le nombre total de clés supprimées
-- NOTE: Ce script est fourni pour référence. En pratique, SCAN ne peut pas
-- être utilisé dans un script Lua car il est bloquant. Utiliser la version
-- Node.js SCAN + DEL dans le code applicatif (cf. redis.adapter.ts).

local count = 0
local cursor = "0"
repeat
  local result = redis.call('SCAN', cursor, 'MATCH', KEYS[1], 'COUNT', 100)
  cursor = result[1]
  local keys = result[2]
  if #keys > 0 then
    redis.call('DEL', unpack(keys))
    count = count + #keys
  end
until cursor == "0"
return count
